package main

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/spf13/cast"
	"github.com/spf13/viper"
	"math/rand"
	"time"
	"tonk/constant"
)

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	tokens := viper.GetStringSlice("auth.tokens")
	for _, token := range tokens {
		proxy := ""
		go collect(token, proxy)

	}
	select {}
}

func collect(token, proxy string) {
	client := resty.New()
	if proxy == "" {
		client = client.SetProxy(proxy)
	}
	for {
		rand.Seed(time.Now().UnixNano())

		// Generate a random number between 100 and 500
		min := 100
		max := 500
		amount := rand.Intn(max-min+1) + min

		resp, err := client.R().
			SetBody(fmt.Sprintf(`{"user_id":%d,"amount":%d,"type":"credit","description":"Deposit"}`, cast.ToInt(token), amount)).
			Post(constant.MinedToken)
		if err != nil {
			fmt.Println("Mine ", amount, "failed", err)
		}
		fmt.Println("Mine ", amount, "success: ", resp)
		time.Sleep(time.Minute)

	}
}
