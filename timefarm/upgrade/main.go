package main

import (
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"
	"timefarm/constant"
	"timefarm/request"
)

func main() {
	viper.SetConfigFile("../conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	tokens := viper.GetStringSlice("data.tokens")
	proxies := viper.GetStringSlice("proxies.data")
	checkTask(tokens, proxies)

}

func checkTask(queries, proxies []string) {

	for i, query := range queries {
		proxy := proxies[i%len(proxies)]

		client := resty.New().SetProxy(proxy)

		var authResponse request.AuthResponse
		res, err := client.
			SetProxy(proxy).
			R().
			SetBody(query).
			SetResult(&authResponse).
			Post(constant.AuthAPI)
		if err != nil {
			fmt.Println("Account idx:", i, "Get auth err: ", err)
			continue
		}

		token := authResponse.Token
		var tasks request.Task

		res, err = client.
			R().
			SetAuthToken(token).
			SetBody(`{}`).
			SetResult(&tasks).
			Get(constant.GetTaskAPI)
		if err != nil {
			fmt.Println("Get task err: ", err)
		}

		for _, task := range tasks {
			if task.Submission == nil {
				res, err = client.
					R().
					SetAuthToken(token).
					SetBody(`{}`).
					SetResult(&tasks).
					Post(fmt.Sprintf(constant.SubmitTaskAPI, task.ID))
				if err != nil {
					fmt.Println("Get task err: ", err)
				}
				fmt.Println("Account idx", i, "finish: ", task.ID, res)
			} else if task.Submission.Status == constant.TaskStatusComplete {
				res, err = client.
					R().
					SetAuthToken(token).
					SetBody(`{}`).
					SetResult(&tasks).
					Post(fmt.Sprintf(constant.ClaimTaskAPI, task.ID))
				fmt.Println("Account idx", i, "claim: ", task.ID, res)

			}
		}

		res, err = client.
			R().
			SetAuthToken(token).
			SetBody(`{}`).
			SetResult(&tasks).
			Post(fmt.Sprintf(constant.UpgradeTimeAPI))
		fmt.Println("Account idx", i, "try to upgrade time: ", res)
	}
}
