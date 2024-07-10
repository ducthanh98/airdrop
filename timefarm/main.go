package main

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"
	"time"
	"timefarm/constant"
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
	client := resty.New()
	for {
		//var authResponse request.AuthResponse
		//res, err := client.
		//	SetProxy(proxy).
		//	R().
		//	SetBody(request.ValidateInitRequest{InitData: query, Platform: "android"}).
		//	SetResult(&authResponse).
		//	Post(constant.AuthAPI)
		//if err != nil {
		//	fmt.Println("Get auth err: ", err)
		//	time.Sleep(5 * time.Minute)
		//	go collect(query, proxy)
		//	return
		//}
		//fmt.Println(res)
		//token := authResponse.Token
		token := query
		res, err := client.
			SetProxy(proxy).
			R().
			SetAuthToken(token).
			SetBody(`{}`).
			Post(constant.FinishAPI)
		if err != nil {
			fmt.Println("Finish api err: ", err)
			time.Sleep(5 * time.Minute)
			continue
		}
		fmt.Println("Finish api", res)

		res, err = client.
			SetProxy(proxy).
			R().
			SetAuthToken(token).
			SetBody(`{}`).
			Post(constant.StartAPI)
		if err != nil {
			fmt.Println("Start api err: ", err)
			time.Sleep(5 * time.Minute)
			go collect(query, proxy)
			return
		}
		fmt.Println("Start api", res)
		time.Sleep(4*time.Hour + 10*time.Minute)
	}

}
