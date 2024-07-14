package main

import (
	"encoding/json"
	"fmt"
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
	"github.com/google/uuid"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"log"
	"net/url"
	"os"
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

	proxies := viper.GetStringSlice("data.proxies")
	secrets := make([]string, 0)

	for i := 16; i < 32; i++ {
		// Create a launcher with options
		path, _ := launcher.LookPath()
		logger.Info("Found path", zap.Any("path", path))

		parsedUrl, _ := url.Parse(proxies[i])
		launcher := launcher.New().Bin(path).
			Proxy(fmt.Sprintf("http://%v", parsedUrl.Host)).
			Headless(true) // Ensure it's set to false for visible UI

		// Launch a browser instance
		browser := rod.New().ControlURL(launcher.MustLaunch()).MustConnect()
		proxyPass, _ := parsedUrl.User.Password()

		page, _ := browser.Page(proto.TargetCreateTarget{URL: "https://ifconfig.co"})
		go browser.MustHandleAuth(parsedUrl.User.Username(), proxyPass)()

		time.Sleep(3 * time.Second)

		// Navigate to the desired URL
		page = browser.MustPage("https://beta1.conet.network/?referral=0x4b53b6f0eb489a90b2a13b8515d63ccc6cf2b267")

		// Wait for the page to load completely
		page.MustWaitLoad()

		// Wait for the element to be ready and click it
		element := page.MustElement(".sc-gjLLEI.izZANN") // CSS selector for the element
		element.MustWaitLoad().MustClick()

		inputElements := page.MustElements("input")
		for _, inputElement := range inputElements {
			err := inputElement.Focus()
			if err != nil {
				log.Fatalf("Failed to focus on input element: %v", err)
			}
			err = inputElement.Input("14101993aA!")
		}

		btn := page.MustElement(".sc-gjLLEI.izZANN")
		btn.MustClick()

		time.Sleep(10 * time.Second)

		page.MustWaitLoad()

		secret := make([]string, 0)
		inputElements = page.MustElements("div.css-1s8bwid p")
		for _, inputElement := range inputElements {
			txt := inputElement.MustText()
			secret = append(secret, txt)
		}

		secrets = append(secrets, strings.Join(secret, " "))
		// Ensure the browser is closed at the end
		browser.MustClose()

	}

	res, _ := json.Marshal(secrets)
	if err := os.WriteFile(fmt.Sprintf("%v.txt", uuid.New().String()), res, 0666); err != nil {
		log.Fatal(err)
	}

}
