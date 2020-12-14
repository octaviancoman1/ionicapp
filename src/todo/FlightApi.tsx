import axios from "axios";
import { authConfig, baseUrl, getLogger, withLogs } from "../core";
import { FlightProps } from "./FlightProps";
import { Plugins } from "@capacitor/core";

const {Storage} = Plugins;
const itemUrl = `http://${baseUrl}/api/flight`;

export const getFlights: (token:string) => Promise<FlightProps[]> = (token)  => {
    var result = axios.get(itemUrl, authConfig(token));
    result.then(function (result){
        result.data.forEach(async (item : FlightProps) => {
            await Storage.set({
                key: item._id!,
                value:JSON.stringify({
                    id:item._id,
                    departureCity:item.departureCity,
                    destinationCity:item.destinationCity,
                    date:item.date,
                    price:item.price,
                    available:item.avaiableSeats,
                    userId:item.userId
                }),
            });
        });
    });


    return withLogs(result, 'getFlights');

}

export const createFlight: (
    token:string,
    item:FlightProps
) => Promise<FlightProps> = (token,item) =>{
    var result = axios.post(itemUrl,item,authConfig(token));
    result.then(async function (r ){
        var item = r.data;
        await Storage.set({
            key:item._id!,
            value:JSON.stringify({
                id:item._id,
                departureCity:item.departureCity,
                destinationCity:item.destinationCity,
                date:item.date,
                price:item.price,
                available:item.avaiableSeats,
                userId:item.userId
            }),

        });
    });
    return withLogs(result,'createFlight');
}

// export const createFlight: (token:string, flight: FlightProps) => Promise<FlightProps[]> = (token, flight) => {
//     return withLogs(axios.post(itemUrl,flight,authConfig(token) ), 'createFlight');
// }
export const updateFlight: (
    token: string,
    item: FlightProps
) => Promise<FlightProps> = (token, item) => {
    var result = axios.put(`${itemUrl}/${item._id}`, item, authConfig(token));
    result.then(async function (r) {
        var item = r.data;
        await Storage.set({
            key: item._id!,
            value: JSON.stringify({
                id:item._id,
                departureCity:item.departureCity,
                destinationCity:item.destinationCity,
                date:item.date,
                price:item.price,
                available:item.avaiableSeats,
                userId:item.userId
            }),
        });
    });
    return withLogs(result, "updateFlight");
};

// export const updateFlight: (token: string, flight: FlightProps) => Promise<FlightProps[]> = (token, flight) => {
//     return withLogs(axios.put(`${itemUrl}/${flight._id}`, flight, authConfig(token)), 'updateFlight');
// }

export const eraseFlight: (
    token: string,
    item: FlightProps
) => Promise<FlightProps> = (token, item) => {
    var result = axios.delete(`${itemUrl}/${item._id}`, authConfig(token));
    result.then(async function (r) {
        await Storage.remove({ key: item._id! });
    });
    return withLogs(result, "deleteItem");
};

export const getFlight: (token: string, id:string) => Promise<FlightProps> = (token,id) =>{
    var result= axios.get(`${itemUrl}/${id}`,authConfig(token))
    return withLogs(result, "getFlight");
}


// export const eraseFlight: (token: string, flight:FlightProps) => Promise<FlightProps[]> = (token, flight) =>{
//     return withLogs(axios.delete(`${itemUrl}/${flight._id}`,authConfig(token)), 'deleteItem');
// }
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
