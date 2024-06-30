package main

import (
	"cube/constant"
	"cube/request"
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

	tokens := viper.GetStringSlice("auth.tokens")
	proxies := viper.GetStringSlice("proxies.data")
	for i, token := range tokens {
		proxy := proxies[i%len(proxies)]
		go collect(token, proxy)

	}
	select {}
}

func collect(token, proxy string) {
	client := resty.New().SetProxy(proxy)
	for {
		resp, err := client.R().
			SetBody(request.CollectRequest{Token: token}).
			Post(constant.MinedToken)
		if err != nil {
			fmt.Println("Mined", token, "failed", err)
		}
		fmt.Println("Mined", token, " : ", resp)
		time.Sleep(10 * time.Second)

	}
}
