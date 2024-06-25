package main

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/go-resty/resty/v2"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/spf13/viper"
	"log"
	"net"
	"net/http"
	"net/url"
	"nodepay/constant"
	"nodepay/request"
	"time"
)

func main() {
	viper.SetConfigFile("./conf.toml")
	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	token := viper.GetString("data.token")
	proxies := viper.GetStringSlice("data.proxies")

	for _, proxyURL := range proxies {
		client := resty.New()
		if proxyURL != "" {
			client.SetProxy(proxyURL)
		}
		var publicIp *request.GetIPResponse

		_, err = client.R().
			SetResult(&publicIp).
			Get("https://api.ipify.org?format=json")
		if err != nil {
			panic("Can't get public ip")
		}

		go pingNetworkDevice(token, proxyURL, publicIp.IP)

		go connectSocket(token, proxyURL, publicIp.IP)
	}

	select {}

}

func connectSocket(token string, proxyURL string, ip string) {
	client := resty.New()
	if proxyURL != "" {
		client.SetProxy(proxyURL)
	}
	var authSessionResponse *request.AuthSessionResponse

	_, err := client.R().
		SetResult(&authSessionResponse).
		SetAuthToken(token).
		Post(fmt.Sprintf("%v/auth/session", constant.BASE_URL))
	if err != nil {
		panic(err)
	}

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
			panic(err)
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
			panic(err)
		}

		resp, err := http.ReadResponse(bufio.NewReader(conn), connectReq)
		if err != nil {
			panic(err)
		}
		if resp.StatusCode != http.StatusOK {
			panic(fmt.Errorf("Proxy CONNECT failed with status: %s", resp.Status))
		}

		// Use the resulting connection as a WebSocket connection
		wsCon, resp, err := websocket.NewClient(conn, ws, nil, 1024, 1024)
		if err != nil {
			log.Printf("Init ws failed with status %d", resp.StatusCode)
			log.Fatal("dial:", err)
		}
		c = wsCon
	} else {
		wsCon, resp, err := websocket.DefaultDialer.Dial(constant.BASE_WSS, nil)
		if err != nil {
			log.Printf("Init ws failed with status %d", resp.StatusCode)
			log.Fatal("dial:", err)
		}
		c = wsCon
	}

	defer c.Close()
	for {
		_, payload, err := c.ReadMessage()
		if err != nil {
			log.Println("Read message error:", err)
			time.Sleep(1 * time.Minute)
			log.Println("Error. Reconnecting after a minute")
			go connectSocket(token, proxyURL, ip)
			return
		}
		var msg *request.WsMessage
		json.Unmarshal(payload, &msg)
		log.Printf("%v: recv: %s", ip, msg)
		if msg.Action == "AUTH" {
			sendAuth(msg, token, c, authSessionResponse)
		} else if msg.Action == "PONG" {
			SendPong(msg, c)
			time.Sleep(constant.PING_INTERVAL * time.Millisecond)
			SendPing(msg, c)
		}
	}
}

func SendPong(msg *request.WsMessage, c *websocket.Conn) {
	tmp := request.PongMessage{
		ID:           msg.ID,
		OriginAction: "PONG",
	}
	body, _ := json.Marshal(tmp)
	err := c.WriteMessage(websocket.TextMessage, body)
	if err != nil {
		log.Println("write:", err)
		return
	}
}

func SendPing(msg *request.WsMessage, c *websocket.Conn) {
	tmp := request.PingMessage{
		ID:     msg.ID,
		Action: "PING",
	}
	body, _ := json.Marshal(tmp)
	err := c.WriteMessage(websocket.TextMessage, body)
	if err != nil {
		log.Println("write:", err)
		return
	}
}

func sendAuth(msg *request.WsMessage, token string, c *websocket.Conn, authSessionResponse *request.AuthSessionResponse) {
	tmp := request.AuthMessage{
		ID:           msg.ID,
		Action:       "PING",
		UserID:       authSessionResponse.Data.UID,
		BrowserID:    uuid.New().String(),
		UserAgent:    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
		Timestamp:    time.Now().Format("20060102150405"),
		DeviceType:   "extension",
		Version:      "2.1.0",
		Token:        token,
		OriginAction: "AUTH",
	}
	body, _ := json.Marshal(tmp)
	err := c.WriteMessage(websocket.TextMessage, body)
	if err != nil {
		log.Println("write:", err)
		return
	}
}

func pingNetworkDevice(token, proxyURL string, ip string) {
	client := resty.New()
	if proxyURL != "" {
		client.SetProxy(proxyURL)
	}

	for {

		_, err := client.R().
			SetAuthToken(token).
			Get(fmt.Sprintf("%v/network/device-network?ip=%v", constant.BASE_URL, ip))
		if err != nil {
			log.Println("Can't ping device")
		}

		time.Sleep(3 * time.Second)
	}
}
