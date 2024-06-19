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
	for _, token := range tokens {
		var duckApi = request.NewDuckApi(token.(string))
		go hatchDuck(duckApi)
		//go collectEgg(duckApi)
		//go collectGoldenDuck(duckApi)

	}
	select {}
}

func collectEgg(duckApi *request.DuckApi) {

	for {
		listRes, err := duckApi.GetList()
		if err != nil {
			log.Errorln("Error", err)
			continue
		}
		nests := listRes.Data.Nest
		ranNest := rand.Intn(len(nests) - 1)
		nest := nests[ranNest]

		ducks := listRes.Data.Duck
		randDuck := rand.Intn(len(ducks))

		duckApi.LayEgg(nest.ID, ducks[randDuck].ID)

		res, _ := duckApi.CollectEgg(nest.ID)
		log.Infoln("Collect Egg nestId", nest.ID, res)
		time.Sleep(500 * time.Millisecond)
	}
}

func hatchDuck(duckApi *request.DuckApi) {
	maxDuckRes, _ := duckApi.GetMaxDuck()
	maxDuck := maxDuckRes.Data.MaxDuck
	if maxDuck < 15 {
		maxDuck = 15
	}

	for {
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
