package main

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"
	"time"
	"timefarm/constant"
	"timefarm/request"
)

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	tokens := (viper.Get("data.tokens")).([]interface{})

	for _, token := range tokens {
		go collect(token.(string))
	}
	select {}

}

func collect(query string) {
	client := resty.New()
	for {
		var authResponse request.AuthResponse
		res, err := client.R().
			SetBody(query).
			SetResult(&authResponse).
			Post(constant.AuthAPI)
		if err != nil {
			fmt.Println("Get auth err: ", err)
			time.Sleep(5 * time.Minute)
			go collect(query)
			return
		}
		token := authResponse.Token

		res, err = client.R().
			SetAuthToken(token).
			SetBody(`{}`).
			Post(constant.FinishAPI)
		if err != nil {
			fmt.Println("Finish api err: ", err)
			time.Sleep(5 * time.Minute)
			continue
		}
		fmt.Println("Finish api", res)

		res, err = client.R().
			SetAuthToken(token).
			SetBody(`{}`).
			Post(constant.StartAPI)
		if err != nil {
			fmt.Println("Start api err: ", err)
			time.Sleep(5 * time.Minute)
			go collect(query)
			return
		}
		fmt.Println("Start api", res)
		time.Sleep(5 * time.Minute)
	}

}
