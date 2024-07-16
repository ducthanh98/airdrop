package main

import (
	"chickcoop/constant"
	"chickcoop/request"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
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

	tokens := viper.GetStringSlice("auth.tokens")
	proxies := viper.GetStringSlice("proxies.data")
	for i, token := range tokens {
		proxy := proxies[i%len(proxies)]
		go process(token, proxy, i)

	}
	select {}
}

func process(query, proxy string, idx int) {
	client := resty.New().SetProxy(proxy).SetHeader("Authorization", query)

	for {
		var state request.Response
		_, err := client.
			R().
			SetResult(&state).
			Get(constant.GetStateAPI)
		if err != nil {
			logger.Error("Get state error", zap.Any("idx", idx), zap.Error(err))
			continue
		}

		if state.Data.RandomGift != nil {
			res, err := client.
				R().
				SetBody(state).
				SetResult(&state).
				Post(constant.GiftClaimAPI)
			if err != nil {
				logger.Error("claim gift error", zap.Any("idx", idx), zap.Error(err))
				continue
			}
			logger.Info("Claim gift: account ", zap.Any("idx", idx), zap.Any("gift", state))
			fmt.Println(res)
		}

		state.Data.Chickens.Quantity++

		_, err = client.
			R().
			SetBody(state).
			SetResult(&state).
			Post(constant.HatchAPI)
		if err != nil {
			logger.Error("Hatch error", zap.Any("idx", idx), zap.Error(err))
			continue
		}
		if state.Ok {
			logger.Info("Hatch account ", zap.Any("idx", idx), zap.Any("status", state.Ok))
		} else {
			logger.Error("Hatch account error", zap.Any("idx", idx), zap.Any("error", state))
		}
		time.Sleep(3 * time.Second)
	}
}
