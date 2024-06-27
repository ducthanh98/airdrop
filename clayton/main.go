package main

import (
	"clayton/constant"
	"clayton/request"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"
	"time"
)

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	tokens := viper.GetStringSlice("data.tokens")
	proxies := viper.GetStringSlice("proxies.data")

	for i, token := range tokens {
		proxy := proxies[i%len(proxies)]

		go collect(token, proxy)
	}
	select {}

}

func collect(query string, proxy string) {
	client := resty.New().SetProxy(proxy)

	res, err := client.R().
		Get("https://api.ipify.org?format=json")
	if err != nil {
		fmt.Println("Can't get public ip")
	}
	fmt.Println("Check proxy:", proxy, "ip:", res)

	for {
		var claimResponseError = &request.ClaimResponseError{}

		res, err := client.
			R().
			SetHeader("Init-Data", query).
			SetBody(`{}`).
			SetError(claimResponseError).
			Post(constant.FinishAPI)
		if err != nil {
			fmt.Println("Finish api err: ", err)
			time.Sleep(5 * time.Minute)
			continue
		}
		fmt.Println("Finish api", res)
		if claimResponseError.Error != "" {
			fmt.Println("Take a rest - 5 minutes")
			time.Sleep(constant.TIME_REST * time.Minute)
			continue
		}
		res, err = client.
			R().
			SetHeader("Init-Data", query).
			SetBody(`{}`).
			Post(constant.StartAPI)
		if err != nil {
			fmt.Println("Start api err: ", err)
			time.Sleep(5 * time.Minute)
			go collect(query, proxy)
			return
		}
		fmt.Println("Start api", res)
		time.Sleep(5 * time.Minute)
	}

}
