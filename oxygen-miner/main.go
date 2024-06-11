package main

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"
	"oxygen-miner/constant"
	"oxygen-miner/request"
)

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	tokens := (viper.Get("auth.tokens")).([]interface{})
	for _, token := range tokens {

	}
	select {}
}

func farm(token string) {
	client := resty.New()
	payload := request.FarmRequest{
		Hash: token,
		Tg:   "1939627995",
	}

	res, _ := client.R().
		SetBody(payload).
		Post(constant.FARM_URL)
	fmt.Println(""res)
}
