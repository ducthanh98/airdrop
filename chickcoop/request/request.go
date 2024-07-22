package request

type ResearchAPIRequest struct {
	ResearchType string `json:"researchType"`
}

type SpinRequest struct {
	Mode string `json:"mode"`
}

type SpinResult struct {
	Ok    bool        `json:"ok"`
	Error interface{} `json:"error"`
	Data  struct {
		WheelState struct {
			NextTimeFreeSpin       int64 `json:"nextTimeFreeSpin"`
			IsAvailableFreeSpin    bool  `json:"isAvailableFreeSpin"`
			AvailablePremiumSpin   int   `json:"availablePremiumSpin"`
			NumberOfSpinsPurchased int   `json:"numberOfSpinsPurchased"`
			AvailableReward        struct {
				ID     string `json:"id"`
				Text   string `json:"text"`
				Type   string `json:"type"`
				Amount int    `json:"amount"`
			} `json:"availableReward"`
			AvailableToBuyAirdropSpins int  `json:"availableToBuyAirdropSpins"`
			IsAvailableWithdraw        bool `json:"isAvailableWithdraw"`
			AccumulatedMoney           int  `json:"accumulatedMoney"`
		} `json:"wheelState"`
	} `json:"data"`
}

type Response struct {
	Ok    bool        `json:"ok"`
	Error interface{} `json:"error"`
	Data  struct {
		Profile struct {
			ID        int           `json:"id"`
			Username  string        `json:"username"`
			PhotoURL  string        `json:"photoUrl"`
			IsPremium bool          `json:"isPremium"`
			InvitedBy int           `json:"invitedBy"`
			XID       string        `json:"xId"`
			Wallets   []interface{} `json:"wallets"`
		} `json:"profile"`
		StartTime int64 `json:"startTime"`
		Chickens  struct {
			Quantity   int `json:"quantity"`
			LayingRate struct {
				Base    float64 `json:"base"`
				Bonus   string  `json:"bonus"`
				Combine float64 `json:"combine"`
			} `json:"layingRate"`
		} `json:"chickens"`
		Eggs struct {
			Quantity float64 `json:"quantity"`
			Value    struct {
				Base    float64 `json:"base"`
				Bonus   string  `json:"bonus"`
				Combine float64 `json:"combine"`
			} `json:"value"`
			HatchingRate struct {
				Base            float64 `json:"base"`
				Bonus           string  `json:"bonus"`
				Combine         float64 `json:"combine"`
				IsAuto          bool    `json:"isAuto"`
				Level           int     `json:"level"`
				LastManualHatch int64   `json:"lastManualHatch"`
				Color           string  `json:"color"`
			} `json:"hatchingRate"`
		} `json:"eggs"`
		Session struct {
			SessionStartTime   int64 `json:"sessionStartTime"`
			LastSessionEndTime int64 `json:"lastSessionEndTime"`
		} `json:"session"`
		LoginHistory []string `json:"loginHistory"`
		Discovery    struct {
			Level              int  `json:"level"`
			AvailableToUpgrade bool `json:"availableToUpgrade"`
		} `json:"discovery"`
		Shop struct {
			IsBoughtStarterPack bool          `json:"isBoughtStarterPack"`
			BoughtPacks         []interface{} `json:"boughtPacks"`
		} `json:"shop"`
		Laboratory struct {
			Regular struct {
				LayingRate struct {
					Tier  int `json:"tier"`
					Level int `json:"level"`
				} `json:"layingRate"`
				EggValue struct {
					Tier  int `json:"tier"`
					Level int `json:"level"`
				} `json:"eggValue"`
				FarmCapacity struct {
					Tier  int `json:"tier"`
					Level int `json:"level"`
				} `json:"farmCapacity"`
			} `json:"regular"`
			Epic struct {
				ReduceCost struct {
					Tier  int `json:"tier"`
					Level int `json:"level"`
				} `json:"reduceCost"`
				FarmValue struct {
					Tier  int `json:"tier"`
					Level int `json:"level"`
				} `json:"farmValue"`
			} `json:"epic"`
		} `json:"laboratory"`
		Boost struct {
			Available []interface{} `json:"available"`
			Active    []interface{} `json:"active"`
			Used      int           `json:"used"`
		} `json:"boost"`
		Activities   []interface{} `json:"activities"`
		Cash         float64       `json:"cash"`
		Gem          int           `json:"gem"`
		Spent        int           `json:"spent"`
		FarmValue    float64       `json:"farmValue"`
		FarmCapacity struct {
			Capacity      int  `json:"capacity"`
			NeedToUpgrade bool `json:"needToUpgrade"`
		} `json:"farmCapacity"`
		ReduceCost struct {
			Laboratory struct {
				Regular string `json:"regular"`
			} `json:"laboratory"`
		} `json:"reduceCost"`
		Invite struct {
			Accepted int `json:"accepted"`
			Reward   int `json:"reward"`
		} `json:"invite"`
		IsCompleteTutorial bool `json:"isCompleteTutorial"`
		RandomGift         *struct {
			ReceiveTime int64 `json:"receiveTime"`
			Gift        struct {
				Name        string `json:"name"`
				Description string `json:"description"`
				Amount      int    `json:"amount"`
				Unit        string `json:"unit"`
			} `json:"gift"`
		} `json:"randomGift"`
		Wheel struct {
			NextTimeFreeSpin           interface{} `json:"nextTimeFreeSpin"`
			IsAvailableFreeSpin        bool        `json:"isAvailableFreeSpin"`
			AvailablePremiumSpin       int         `json:"availablePremiumSpin"`
			NumberOfSpinsPurchased     int         `json:"numberOfSpinsPurchased"`
			AvailableReward            interface{} `json:"availableReward"`
			AvailableToBuyAirdropSpins int         `json:"availableToBuyAirdropSpins"`
			IsAvailableWithdraw        bool        `json:"isAvailableWithdraw"`
			AccumulatedMoney           int         `json:"accumulatedMoney"`
		} `json:"wheel"`
		Chest struct {
			Silver struct {
				Available int `json:"available"`
				Open      int `json:"open"`
			} `json:"silver"`
			Golden struct {
				Available int `json:"available"`
				Open      int `json:"open"`
			} `json:"golden"`
		} `json:"chest"`
		Nft            []interface{} `json:"nft"`
		IsNewUser      bool          `json:"isNewUser"`
		IsAcceptInvite bool          `json:"isAcceptInvite"`
		UI             struct {
			IsShowAirDrop                bool `json:"isShowAirDrop"`
			IsUseExternalRank            bool `json:"isUseExternalRank"`
			IsShowExternalPurchaseButton bool `json:"isShowExternalPurchaseButton"`
		} `json:"ui"`
	} `json:"data"`
	IsAcceptInvite bool `json:"isAcceptInvite"`
}
