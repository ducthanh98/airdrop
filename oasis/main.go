package main

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/spf13/viper"
	"log"
	"net"
	"net/http"
	"net/url"
	"oasis/constant"
	"oasis/request"
	"sync"
	"time"
)

var lock struct {
	sync.Mutex // <-- this mutex protects
}

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	token := viper.GetString("data.token")
	proxies := viper.GetStringSlice("data.proxies")

	for _, proxyURL := range proxies {
		//pingNetworkDevice(token, proxyURL)

		connectSocket(token, proxyURL)
	}

	select {}

}

func connectSocket(token string, proxyURL string) {
	//client := resty.New()
	//if proxyURL != "" {
	//	client.SetProxy(proxyURL)
	//}
	//var authSessionResponse *request.AuthSessionResponse
	//
	//_, err := client.R().
	//	SetResult(&authSessionResponse).
	//	SetAuthToken(token).
	//	Post(fmt.Sprintf("%v/auth/session", constant.BASE_URL))
	//if err != nil {
	//	fmt.Println("Auth session err", err)
	//	log.Println(" Reconnecting after a minute")
	//	time.Sleep(1 * time.Minute)
	//	go connectSocket(token, proxyURL)
	//	return
	//}

	var c *websocket.Conn

	if proxyURL != "" {
		proxy, err := url.Parse(proxyURL)
		if err != nil {
			panic(err)
		}

		ws, err := url.Parse(constant.BASE_WSS)
		if err != nil {
			panic(err)
		}

		conn, err := net.Dial("tcp", proxy.Host)
		if err != nil {
			fmt.Println("Dial error", err)
			log.Println(" Reconnecting after a minute")
			time.Sleep(1 * time.Minute)
			go connectSocket(token, proxyURL)
			return
		}
		defer conn.Close()

		connectReq := &http.Request{
			Method: http.MethodConnect,
			URL:    proxy,
			Host:   ws.Host,
			Header: make(http.Header),
		}
		connectReq.Header.Set("Proxy-Connection", "keep-alive")

		pass, _ := proxy.User.Password()

		auth := proxy.User.Username() + ":" + pass
		basicAuth := "Basic " + base64.StdEncoding.EncodeToString([]byte(auth))
		connectReq.Header.Set("Proxy-Authorization", basicAuth)

		err = connectReq.Write(conn)
		if err != nil {
			fmt.Println("Write connect error", err)
			log.Println(" Reconnecting after a minute")
			time.Sleep(1 * time.Minute)
			go connectSocket(token, proxyURL)
			return
		}

		resp, err := http.ReadResponse(bufio.NewReader(conn), connectReq)
		if err != nil {
			fmt.Println("Read response err", err)
			log.Println(" Reconnecting after a minute")
			time.Sleep(1 * time.Minute)
			go connectSocket(token, proxyURL)
			return
		}
		if resp.StatusCode != http.StatusOK {
			fmt.Println("Proxy CONNECT failed with status:", resp.Status)
			log.Println(" Reconnecting after a minute")
			time.Sleep(1 * time.Minute)
			go connectSocket(token, proxyURL)
			return
		}

		// Use the resulting connection as a WebSocket connection
		wsCon, resp, err := websocket.NewClient(conn, ws, nil, 1024, 1024)
		if err != nil {
			log.Printf("Init ws failed with status %d", resp.StatusCode)
			log.Println("dial:", err)
			log.Println(" Reconnecting after a minute")
			time.Sleep(1 * time.Minute)
			go connectSocket(token, proxyURL)
			return
		}
		c = wsCon
	} else {
		sv := fmt.Sprintf(constant.BASE_WSS, token)
		wsCon, resp, err := websocket.DefaultDialer.Dial(sv, nil)
		if err != nil {
			log.Printf("Init ws failed with status %d", resp.StatusCode)
			log.Println("dial:", err)
			log.Println(" Reconnecting after a minute")
			time.Sleep(1 * time.Minute)
			go connectSocket(token, proxyURL)
			return
		}
		c = wsCon
	}

	defer c.Close()

	heartbeatTicker := time.NewTicker(time.Second)
	metricsTicker := time.NewTicker(2 * time.Second)
	errorChan := make(chan bool)
	go func() {
		for {
			select {
			case <-heartbeatTicker.C:
				err := sendHeartbeat(c)
				if err != nil {
					errorChan <- true
					return
				}
			case <-metricsTicker.C:

				err := sendMetrics(c)
				if err != nil {
					errorChan <- true
					return

				}

			}
		}
	}()

	<-errorChan
	fmt.Println("Error. Retrying after a min")
	time.Sleep(1 * time.Minute)
	go connectSocket(token, proxyURL)
}

func sendMetrics(c *websocket.Conn) error {
	tmp := request.WsRequest{
		Type: "settings",
		Data: `{"type":"settings","data":{"mostRecentModel":"todo","userSettings":{"schedule":{"mode":"all","days":["monday","tuesday","wednesday","thursday","friday"],"startTime":"10:00","stopTime":"16:00","usage":"maximum"},"enabledModels":[]},"systemInfo":{"cpuInfo":{"archName":"x86_64","features":["mmx","sse","sse2","sse3","ssse3","sse4_1","sse4_2","avx"],"modelName":"11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz","numOfProcessors":8,"processors":[{"usage":{"idle":14164178593750,"kernel":273043437500,"total":14649615781250,"user":212393750000}},{"usage":{"idle":14236624375000,"kernel":217418593750,"total":14649614218750,"user":195571250000}},{"usage":{"idle":13845941406250,"kernel":363910937500,"total":14649614218750,"user":439761875000}},{"usage":{"idle":13938280468750,"kernel":308302031250,"total":14649614218750,"user":403031718750}},{"usage":{"idle":14032352812500,"kernel":301410468750,"total":14649614218750,"user":315850937500}},{"usage":{"idle":14094232968750,"kernel":253281250000,"total":14649614062500,"user":302099843750}},{"usage":{"idle":13931273750000,"kernel":328632187500,"total":14649614062500,"user":389708125000}},{"usage":{"idle":14005404687500,"kernel":274691718750,"total":14649614062500,"user":369517656250}}],"temperatures":[]},"memoryInfo":{"availableCapacity":873607168,"capacity":8375296000},"gpuInfo":{"vendor":"Google Inc. (Intel)","renderer":"ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)"}},"extensionVersion":"0.1.0","chromeVersion":"126"}}`,
	}
	return writeSocketMessage(c, tmp)
}

func sendHeartbeat(c *websocket.Conn) error {
	tmp := request.WsRequest{
		Type: "heartbeat",
		Data: request.HeartbeatData{Status: "active"},
	}
	return writeSocketMessage(c, tmp)
}

func writeSocketMessage(c *websocket.Conn, msg interface{}) error {
	lock.Lock()
	defer lock.Unlock()
	body, _ := json.Marshal(msg)
	fmt.Println(string(body))
	err := c.WriteMessage(websocket.TextMessage, body)
	return err
}
