package constant

import "fmt"

const BASE_URL = "https://tonclayton.fun/api"

var AuthAPI = fmt.Sprintf("%v/user/login", BASE_URL)
var FinishAPI = fmt.Sprintf("%v/user/claim", BASE_URL)
var StartAPI = fmt.Sprintf("%v/user/start", BASE_URL)

const TIME_REST = 5
