import axios from "axios";
import { authConfig, baseUrl, getLogger, withLogs } from "../core";
import { FlightProps } from "./FlightProps";

const itemUrl = `http://${baseUrl}/api/flight`;

export const getFlights: (token:string) => Promise<FlightProps[]> = token => {
    return withLogs(axios.get(itemUrl, authConfig(token)), 'getFlights');

}

export const createFlight: (token:string, flight: FlightProps) => Promise<FlightProps[]> = (token, flight) => {
    return withLogs(axios.post(itemUrl,flight,authConfig(token) ), 'createFlight');
}

export const updateFlight: (token: string, flight: FlightProps) => Promise<FlightProps[]> = (token, flight) => {
    return withLogs(axios.put(`${itemUrl}/${flight._id}`, flight, authConfig(token)), 'updateFlight');
}

export const eraseFlight: (token: string, flight:FlightProps) => Promise<FlightProps[]> = (token, flight) =>{
    return withLogs(axios.delete(`${itemUrl}/${flight._id}`,authConfig(token)), 'deleteItem');
}
interface MessageData {
    type: string;
    payload: FlightProps;
}

const log = getLogger('ws');

export const newWebSocket = (token: string, onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`);
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
    };
    ws.onclose = () => {
        log('web socket onclose');
    };
    ws.onerror = error => {
        log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}
