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
	lastUpgradeEgg := time.Now()
	lastSpin := time.Now()
	lastDailyCheckin := time.Now()
	captchaURL := viper.GetString("captcha.server")
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

		if time.Now().Sub(lastUpgradeEgg) > time.Hour {
			lastUpgradeEgg = time.Now()
			res, err := client.
				R().
				SetBody(request.ResearchAPIRequest{ResearchType: constant.ResearchTypeEggValue}).
				SetResult(&state).
				Post(constant.ResearchAPI)
			if err != nil {
				logger.Error("Try to upgrade egg value error", zap.Any("idx", idx), zap.Error(err))
			} else {
				logger.Info("Try to upgrade egg value : account ", zap.Any("idx", idx), zap.Any("state", res))

			}

			res, err = client.
				R().
				SetBody(request.ResearchAPIRequest{ResearchType: constant.ResearchTypeLayingRate}).
				SetResult(&state).
				Post(constant.ResearchAPI)
			if err != nil {
				logger.Error("Try to upgrade laying rate error", zap.Any("idx", idx), zap.Error(err))
			} else {
				logger.Info("Try to upgrade laying rate : account ", zap.Any("idx", idx), zap.Any("state", res))

			}
		}

		// DAILY
		if time.Now().Sub(lastDailyCheckin) > 12*time.Hour {
			body := struct {
				ID         string `json:"id"`
				Name       string `json:"name"`
				GemsReward int    `json:"gemsReward"`
				Achieved   bool   `json:"achieved"`
				Rewarded   bool   `json:"rewarded"`
			}{
				ID:         "daily.checkin",
				Name:       "Check in game",
				GemsReward: 5,
				Achieved:   true,
				Rewarded:   false,
			}

			lastUpgradeEgg = time.Now()
			res, err := client.
				R().
				SetBody(body).
				Post(constant.ClaimDailyAPI)
			if err != nil {
				logger.Error("Try to check in error", zap.Any("idx", idx), zap.Error(err))
			} else {
				logger.Info("Try to check in : account ", zap.Any("idx", idx), zap.Any("state", res))

			}
			lastDailyCheckin = time.Now()

		}
		// SPIN
		if time.Now().Sub(lastSpin) > time.Hour {
			var spinResult request.SpinResult
			lastUpgradeEgg = time.Now()
			res, err := client.
				R().
				SetBody(request.SpinRequest{Mode: constant.SpinModeFree}).
				SetResult(&spinResult).
				Post(constant.SpinAPI)
			if err != nil {
				logger.Error("Try to tak a spin error", zap.Any("idx", idx), zap.Error(err))
			} else {
				logger.Info("Try to take a spin : account ", zap.Any("idx", idx), zap.Any("state", res))

			}

			if spinResult.Ok {
				res, err = client.
					R().
					SetBody(spinResult).
					Post(constant.ClaimSpinAPI)
				if err != nil {
					logger.Error("Try to claim the spin result error", zap.Any("idx", idx), zap.Error(err))
				} else {
					logger.Info("Try to the spin result : account ", zap.Any("idx", idx), zap.Any("state", res))

				}
			}
			lastSpin = time.Now()

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
			logger.Info("Claim gift: account ", zap.Any("idx", idx), zap.Any("gift", res))
		}

		if state.Data.Discovery.AvailableToUpgrade {
			state.Data.Discovery.Level++
			state.Data.Discovery.AvailableToUpgrade = false

			res, err := client.
				R().
				SetBody(state).
				SetResult(&state).
				Post(constant.UpgradelevelAPI)
			if err != nil {
				logger.Error("claim gift error", zap.Any("idx", idx), zap.Error(err))
				continue
			}
			logger.Info("Upgrade egg level: account ", zap.Any("idx", idx), zap.Any("egg", res))

		}

		if state.Data.FarmCapacity.NeedToUpgrade {

			res, err := client.
				R().
				SetBody(request.ResearchAPIRequest{ResearchType: constant.ResearchTypeFarmCapacity}).
				SetResult(&state).
				Post(constant.ResearchAPI)
			if err != nil {
				logger.Error("Upgrade farm capacity error", zap.Any("idx", idx), zap.Error(err))
				continue
			}
			logger.Info("Upgrade farm capacity : account ", zap.Any("idx", idx), zap.Any("state", res))

		}

		state.Data.Chickens.Quantity++

		res, err := client.
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
			logger.Error("Hatch account error", zap.Any("idx", idx), zap.Any("error", res))

			// TRY TO VERIFY CAPTCHA
			var challenge request.ChallengeResponse
			_, err := client.
				R().
				SetResult(&challenge).
				Get(constant.GetChallenge)
			if err != nil {
				logger.Error("Get challenge error", zap.Any("idx", idx), zap.Error(err))
				continue
			}
			if challenge.Ok {
				logger.Info("Bypass captcha - doing : ", zap.Any("idx", idx))
				res, err = resty.New().
					R().
					SetBody(challenge.Data.Challenge).
					SetResult(&challenge).
					Post(captchaURL)
				logger.Info("Detect captcha - result : ", zap.Any("idx", idx), zap.Any("res", res.String()))

				res, err = client.
					R().
					SetBody(res.String()).
					SetResult(&challenge).
					Post(constant.VerifyChallenge)
				logger.Info("Bypass captcha - result : ", zap.Any("idx", idx), zap.Any("res", res.String()))

			}

		}
		time.Sleep(3 * time.Second)
	}
}
