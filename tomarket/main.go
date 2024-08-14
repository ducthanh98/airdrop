package main

import (
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"math/rand"
	"net/url"
	"os"
	"time"
	"tomarket/constant"
	"tomarket/request"
)

// Create a new logger instance
var log = logrus.New()

func main() {

	// Set the output to standard output
	log.Out = os.Stdout

	// Set the log level to info
	log.SetLevel(logrus.InfoLevel)

	// Enable colored output
	log.SetFormatter(&logrus.TextFormatter{
		ForceColors:   true,
		FullTimestamp: true,
	})

	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	tokens := viper.GetStringSlice("auth.tokens")
	proxies := viper.GetStringSlice("proxies.data")
	farmId := viper.GetString("auth.farm_id")
	gameId := viper.GetString("auth.game_id")
	claimId := viper.GetString("auth.check_in")

	isProxyMode := len(proxies) == 0
	for i, token := range tokens {
		proxy := ""
		if isProxyMode {
			proxy = proxies[i%len(proxies)]
		}
		go claim(token, proxy, farmId, gameId, claimId)

	}
	select {}
}

func claim(query, proxy, farmId, gameId, checkinId string) {
	client := resty.New()
	if proxy != "" {
		client.SetProxy(proxy)
	}

	params, err := url.ParseQuery(query)
	if err != nil {
		fmt.Println("Error parsing query:", err)
		return
	}

	// Get the value of the "user" parameter
	userParam := params.Get("user")

	// URL-decode the user parameter value
	userDecoded, err := url.QueryUnescape(userParam)
	if err != nil {
		fmt.Println("Error decoding user parameter:", err)
		return
	}

	// Parse the JSON string
	var user request.QueryData
	err = json.Unmarshal([]byte(userDecoded), &user)
	if err != nil {
		fmt.Println("Error parsing user JSON:", err)
		return
	}
	userId := user.ID
	//lastClaimDaily := time.Now()

	for {

		var loginResponse request.LoginResponse

		resp, err := client.R().
			SetBody(request.LoginRequest{InitData: query}).
			SetResult(&loginResponse).
			Post(constant.LoginURL)
		// Check for errors
		if err != nil {
			log.Errorln("Get auth for userId: %v : %v", userId, err)
			log.Infoln("Retry %v after 5 min", userId)
			time.Sleep(5 * time.Minute)
			continue
		}
		token := loginResponse.Data.AccessToken

		var balanceResponse request.GetBalanceResponse

		resp, err = client.R().
			SetHeader("Authorization", token).
			SetResult(&balanceResponse).
			Get(constant.GetBalanceURL)
		// Check for errors
		if err != nil {
			log.Errorln("Get balance error: %v : %v", userId, err)
			log.Infoln("Retry %v after 5 min", userId)
			time.Sleep(5 * time.Minute)
			continue
		}

		resp, err = client.R().
			SetHeader("Authorization", token).
			SetBody(request.ClaimRequest{GameID: checkinId}).
			Post(constant.DailyClaimURL)
		// Check for errors
		if err != nil {
			log.Errorln("Claim daily %v error : %v", userId, err)
			time.Sleep(5 * time.Minute)
			continue
		}
		log.Infoln("Claim daily ", userId, "res", resp)

		if balanceResponse.Data.Farming != nil {
			resp, err = client.R().
				SetHeader("Authorization", token).
				SetBody(request.ClaimRequest{GameID: farmId}).
				Post(constant.ClaimMiningURL)
			// Check for errors
			if err != nil {
				log.Errorln("Claim mining %v error : %v", userId, err)
				time.Sleep(5 * time.Minute)
				continue
			}
			log.Infoln("Claim mining ", userId, "res", resp)

			resp, err = client.R().
				SetHeader("Authorization", token).
				SetBody(request.ClaimRequest{GameID: farmId}).
				Post(constant.StartMiningURL)
			// Check for errors
			if err != nil {
				log.Errorln("Start mining  %v error : %v", userId, err)
				time.Sleep(5 * time.Minute)
				continue
			}
			log.Infoln("Start mining userId ", userId, "res", resp)
		} else {
			resp, err = client.R().
				SetHeader("Authorization", token).
				SetBody(request.ClaimRequest{GameID: farmId}).
				Post(constant.StartMiningURL)
			// Check for errors
			if err != nil {
				log.Errorln("Start mining  %v error : %v", userId, err)
				time.Sleep(5 * time.Minute)
				continue
			}
			log.Infoln("Start mining userId ", userId, "res", resp)
		}

		if balanceResponse.Data.PlayPasses > 0 {
			// Start game
			var playGameResponse request.PlayGameResponse
			_, err := client.R().
				SetHeader("Authorization", token).
				SetBody(request.ClaimRequest{GameID: gameId}).
				SetResult(&playGameResponse).
				Post(constant.PlayGameURL)
			// Check for errors
			if err != nil {
				log.Errorln("Play game %v error: %v", userId, err)
				time.Sleep(5 * time.Minute)
				continue
			}
			log.Infoln("Start game userId ", userId, " : ", resp)

			duration := playGameResponse.Data.EndAt - playGameResponse.Data.StartAt
			log.Infoln("UserId ", userId, " Wait ", time.Duration(duration)*time.Second, "seconds for finishing stupid game")
			time.Sleep(time.Duration(duration) * time.Second)

			// Convert the duration to time.Duration (in nanoseconds)
			rand.Seed(time.Now().UnixNano())

			// Generate a random duration between 500 and 1000 milliseconds
			min := 550
			max := 650
			points := rand.Intn(max-min+1) + min
			resp, err = client.R().
				SetHeader("Authorization", token).
				SetBody(request.ClaimRequest{GameID: gameId, Points: points}).
				Post(constant.EndGameURL)
			// Check for errors
			if err != nil {
				log.Errorln("End game userId  %v error: : %v", userId, err)
				time.Sleep(5 * time.Minute)
				continue
			}
			// Print the sleep duration
			log.Infoln("UserId", userId, "claim game", resp)

		}
		log.Infoln("UserId ", userId, "sleep 10m")
		time.Sleep(10 * time.Minute)

	}

}
