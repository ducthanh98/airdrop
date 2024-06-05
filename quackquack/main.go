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
//		go hatchDuck(duckApi)
		go collectEgg(duckApi)
		go collectGoldenDuck(duckApi)

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
		log.Infoln(listRes)
		nests := listRes.Data.Nest
		ranNest := rand.Intn(len(nests) )
		nest := nests[ranNest]

		ducks := listRes.Data.Duck
		randDuck := rand.Intn(len(ducks) )

		duckApi.LayEgg(nest.ID, ducks[randDuck].ID)

		res, _ := duckApi.CollectEgg(nest.ID)
		log.Infoln("Collect Egg nestId", nest.ID, res)
		time.Sleep(500 * time.Millisecond)
	}
}

func hatchDuck(duckApi *request.DuckApi) {
	maxDuckRes, _ := duckApi.GetMaxDuck()
	maxDuck := maxDuckRes.Data.MaxDuck

	for {
		listRes, _ := duckApi.GetList()
		nest := listRes.Data.Nest[len(listRes.Data.Nest)-1]
		ducks := listRes.Data.Duck
		randDuck := rand.Intn(len(ducks) - 1)

		res, _ := duckApi.LayEgg(nest.ID, ducks[randDuck].ID)
		var removedDuck = ducks[0]
		if len(ducks) >= maxDuck {
			sort.Slice(ducks, func(i, j int) bool {
				return ducks[i].TotalRare < ducks[i].TotalRare
			})
			duckApi.RemoveDuck([]int{ducks[0].ID})
			log.Infoln("Collect Egg nestId", nest.ID, res)

		}

		res, _ = duckApi.HatchDuck(nest.ID)

		time.Sleep(5 * time.Second)
		res, _ = duckApi.CollectDuck(nest.ID)

		log.Infoln("Remove duck id: ", removedDuck.ID, "rare", removedDuck.TotalRare, " Received new duck", nest.ID, res)
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
