package main

import (
	"fmt"
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"log"
	"net/url"
	"strings"
	"time"
)

var logger *zap.Logger

func main() {
	config := zap.NewDevelopmentConfig()
	config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	logger, _ = config.Build()

	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	wallets := viper.GetStringSlice("data.wallets")
	proxies := viper.GetStringSlice("data.proxies")
	password := viper.GetString("data.password")

	for i, wallet := range wallets {
		go mine(wallet, proxies[i%len(proxies)], password, i)
	}

	select {}
}

func mine(wallet, proxy, password string, idx int) {
	// Create a launcher with options
	path, _ := launcher.LookPath()
	logger.Info(fmt.Sprintf("Wallet  %v Found path", idx), zap.Any("path", path))

	parsedUrl, _ := url.Parse(proxy)
	launcher := launcher.New().Bin(path).
		Headless(true) // Ensure it's set to false for visible UI
	if proxy != "" {
		launcher = launcher.Proxy(fmt.Sprintf("http://%v", parsedUrl.Host))

	}

	// Launch a browser instance
	browser := rod.New().ControlURL(launcher.MustLaunch()).MustConnect()

	// Ensure the browser is closed at the end
	defer browser.MustClose()

	page, err := browser.Page(proto.TargetCreateTarget{URL: "https://ifconfig.co"})
	if proxy != "" {
		proxyPass, _ := parsedUrl.User.Password()
		go browser.MustHandleAuth(parsedUrl.User.Username(), proxyPass)()
	}

	time.Sleep(3 * time.Second)

	// Navigate to the desired URL
	page = browser.MustPage("https://beta1.conet.network/")

	// Wait for the page to load completely
	page.MustWaitLoad()

	// Wait for the element to be ready and click it
	element := page.MustElement(".sc-kMzELR.cTRjnV") // CSS selector for the element
	element.MustWaitLoad().MustClick()

	page.MustWaitLoad()

	// Find the first input element (adjust the CSS selector as needed)
	inputElements := page.MustElements("input")
	keywords := strings.Split(wallet, " ")
	i := 0
	for i = 0; i < len(keywords); i++ {
		inputElement := inputElements[i]
		// Focus on the input element
		err := inputElement.Focus()
		if err != nil {
			log.Fatalf("Failed to focus on input element: %v", err)
		}
		err = inputElement.Input(keywords[i])
		if err != nil {
			log.Fatalf("Failed to paste text into input element: %v", err)
		}
	}

	for ; i < len(inputElements); i++ {
		inputElement := inputElements[i]
		err := inputElement.Focus()
		if err != nil {
			log.Fatalf("Failed to focus on input element: %v", err)
		}
		err = inputElement.Input(password)
		if err != nil {
			log.Fatalf("Failed to paste text into input element: %v", err)
		}
	}

	// Find the button element using its CSS selector
	button := page.MustElement(`button.sc-gjLLEI.izZANN div.sc-eAKtBH.dedKAL`)

	// Click the button
	button.MustClick()

	time.Sleep(5 * time.Second)
	// Wait for the page to load completely
	page.MustWaitLoad()

	// Confirm password
	inputElement := page.MustElement("input")
	err = inputElement.Focus()
	if err != nil {
		log.Fatalf("Failed to focus on input element: %v", err)
	}
	err = inputElement.Input(password)
	if err != nil {
		log.Fatalf("Failed to paste text into input element: %v", err)
	}

	// Find the button element using its CSS selector
	button = page.MustElement(`button.sc-gjLLEI.izZANN div.sc-eAKtBH.dedKAL`)

	// Click the button
	button.MustClick()

	time.Sleep(5 * time.Second)
	// Wait for the page to load completely
	page.MustWaitLoad()

	// Find the button element using its CSS selector
	button = page.MustElement(`input.css-1m9pwf3`)
	// Click the button
	button.MustClick()

	button = page.MustElement(`div.sc-dQmiwx.jyJvBb`)

	// Click the button
	button.MustClick()
	logger.Info(fmt.Sprintf("Wallet %v start mining", idx))

	for {
		element := page.MustElement("div.sc-hABBmJ.kdGLpR > p:nth-of-type(2)")

		// Get the text content of the element
		cnptNumber := element.MustText()
		logger.Info(fmt.Sprintf("Wallet %v : current balance %v ", idx, cnptNumber))

		time.Sleep(1 * time.Minute)
	}
}
