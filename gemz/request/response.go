package request

type AuthResponse struct {
	Token             string              `json:"token"`
	Info              Info                `json:"info"`
	FarmingInfo       FarmingInfo         `json:"farmingInfo"`
	LevelDescriptions []LevelDescriptions `json:"levelDescriptions"`
	BalanceInfo       BalanceInfo         `json:"balanceInfo"`
	DailyRewardInfo   interface{}         `json:"dailyRewardInfo"`
}
type Info struct {
	OriginalLanguage    string `json:"originalLanguage"`
	Language            string `json:"language"`
	OnboardingCompleted bool   `json:"onboardingCompleted"`
	Level               int    `json:"level"`
}
type FarmingInfo struct {
	FarmingDurationInSec int `json:"farmingDurationInSec"`
	FarmingReward        int `json:"farmingReward"`
}
type LevelDescriptions struct {
	Level             string `json:"level"`
	FarmMultiplicator int    `json:"farmMultiplicator"`
	Price             int    `json:"price,omitempty"`
}
type Referral struct {
}
type BalanceInfo struct {
	Balance  int      `json:"balance"`
	Referral Referral `json:"referral"`
}
