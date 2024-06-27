package main

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"math/rand"
	"quackquack/request"
	"sort"
	"time"
)

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	tokens := (viper.Get("auth.tokens")).([]interface{})
	proxies := viper.GetStringSlice("proxies.data")
	for i, token := range tokens {
		proxy := proxies[i%len(proxies)]
		var duckApi = request.NewDuckApi(token.(string), proxy)
		go hatchDuck(duckApi)
		go collectEgg(duckApi)
		go collectGoldenDuck(duckApi)

	}
	select {}
}

func collectEgg(duckApi *request.DuckApi) {

	for {
		listRes, err := duckApi.GetList()
		if err != nil {
			log.Errorln("GetList Error", err)
			continue
		}
		nests := listRes.Data.Nest

		for i := 0; i < len(nests); i++ {
			nest := nests[i]

			ducks := listRes.Data.Duck
			randDuck := rand.Intn(len(ducks))

			duckApi.LayEgg(nest.ID, ducks[randDuck].ID)

			res, _ := duckApi.CollectEgg(nest.ID)
			log.Infoln("Collect Egg nestId", nest.ID, res)
			time.Sleep(100 * time.Millisecond)
		}

	}
}

func hatchDuck(duckApi *request.DuckApi) {

	for {
		maxDuckRes, _ := duckApi.GetMaxDuck()
		maxDuck := maxDuckRes.Data.MaxDuck
		if maxDuck < 15 {
			continue
			// Sometimes the API does not work, so it will be skipped when the quantity is less than the default quantity.
			// Otherwise, you might lose some rare ducks.
		}

		listRes, _ := duckApi.GetList()
		nest := listRes.Data.Nest[len(listRes.Data.Nest)-1]
		ducks := listRes.Data.Duck
		randDuck := rand.Intn(len(ducks) - 1)

		res, _ := duckApi.LayEgg(nest.ID, ducks[randDuck].ID)
		log.Infoln("LayEgg Egg nestId", nest.ID, res)
		var removedDuckId = 0
		var removedRare = 0
		if len(ducks) >= maxDuck {
			sort.Slice(ducks, func(i, j int) bool {
				return ducks[i].TotalRare < ducks[j].TotalRare
			})
			removedDuckId = ducks[0].ID
			removedRare = ducks[0].TotalRare
			duckApi.RemoveDuck([]int{ducks[0].ID})

		}

		res, _ = duckApi.HatchDuck(nest.ID)

		time.Sleep(5 * time.Second)
		res, _ = duckApi.CollectDuck(nest.ID)

		log.Infoln("Remove duck id: ", removedDuckId, "rare", removedRare, " Received new duck", nest.ID, res)
		time.Sleep(5 * time.Second)

	}
}

func collectGoldenDuck(duckApi *request.DuckApi) {

	for {

		resp, _ := duckApi.RewardGoldenDuck()

		resp, _ = duckApi.CollectGoldenDuck()
		log.Infoln("Claim golden duck: ", resp)

		time.Sleep(60 * time.Second)
	}

}
