package constant

import "fmt"

const BASE_URL = "https://tg-bot-tap.laborx.io/api/v1"

var AuthAPI = fmt.Sprintf("%v/auth/validate-init", BASE_URL)
var FinishAPI = fmt.Sprintf("%v/farming/finish", BASE_URL)
var StartAPI = fmt.Sprintf("%v/farming/start", BASE_URL)
