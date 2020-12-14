import React, { useCallback, useContext, useEffect, useReducer } from "react";
import PropTypes from "prop-types";
import { getLogger } from "../core";
import { FlightProps } from "./FlightProps";
import {
    createFlight,
    getFlights,
    newWebSocket,
    updateFlight,
    eraseFlight,
    getFlight,
} from "./FlightApi";
import {AuthContext} from "../auth/AuthProvider";
import { Storage } from "@capacitor/core";
const log = getLogger("ItemProvider");

type SaveItemFn = (item: FlightProps, connected:boolean) => Promise<any>;
type DeleteItemFn = (item: FlightProps, connected:boolean) => Promise<any>;
type UpdateServerFn = () => Promise<any>;
type ServerItem = (id:string, version:number) => Promise<any>;

export interface ItemsState {
    items?: FlightProps[];
    oldItem?: FlightProps,
    fetching: boolean;
    fetchingError?: Error | null;
    saving: boolean;
    deleting: boolean;
    savingError?: Error | null;
    deletingError?: Error | null;
    saveItem?: SaveItemFn;
    deleteItem?: DeleteItemFn;
    updateServer?: UpdateServerFn;
    getServerItem?:ServerItem;
}

interface ActionProps {
    type: string;
    payload?: any;
}

const initialState: ItemsState = {
    fetching: false,
    saving: false,
    deleting: false,
};

const FETCH_ITEMS_STARTED = "FETCH_ITEMS_STARTED";
const FETCH_ITEMS_SUCCEEDED = "FETCH_ITEMS_SUCCEEDED";
const FETCH_ITEMS_FAILED = "FETCH_ITEMS_FAILED";
const SAVE_ITEM_STARTED = "SAVE_ITEM_STARTED";
const SAVE_ITEM_SUCCEEDED = "SAVE_ITEM_SUCCEEDED";
const SAVE_ITEM_FAILED = "SAVE_ITEM_FAILED";
const DELETE_ITEM_STARTED = "DELETE_ITEM_STARTED";
const DELETE_ITEM_SUCCEEDED = "DELETE_ITEM_SUCCEEDED";
const DELETE_ITEM_FAILED = "DELETE_ITEM_FAILED";

const SAVE_ITEM_SUCCEEDED_OFFLINE = "SAVE_ITEM_SUCCEEDED_OFFLINE";
const CONFLICT = "CONFLICT";
const CONFLICT_SOLVED = "CONFLICT_SOLVED";

const reducer: (state: ItemsState, action: ActionProps) => ItemsState = (
    state,
    { type, payload }
) => {
    switch (type) {
        case FETCH_ITEMS_STARTED:
            return { ...state, fetching: true, fetchingError: null };
        case FETCH_ITEMS_SUCCEEDED:
            return { ...state, items: payload.items, fetching: false };
        case FETCH_ITEMS_FAILED:
            //return { ...state, fetchingError: payload.error, fetching: false };
            return {...state, items: payload.items, fetching: false};
        case SAVE_ITEM_STARTED:
            return { ...state, savingError: null, saving: true };
        case SAVE_ITEM_SUCCEEDED:
            const items = [...(state.items || [])];
            const item = payload.item;
            if (item._id !== undefined){
                const index = items.findIndex((it)=> it._id === item._id);
                if (index === -1){
                    items.splice(0,0,item);
                }else{
                    items[index] = item;
                }
                return {...state, items, saving:false};
            }
            return {...state, items};

        case SAVE_ITEM_SUCCEEDED_OFFLINE: {
            const items = [...(state.items || [])];
            const item = payload.item;
            const index = items.findIndex((it) => it._id === item._id);
            if (index === -1) {
                items.splice(0, 0, item);
            } else {
                items[index] = item;
            }
            return { ...state, items, saving: false };
        }

        case CONFLICT: {
            log("CONFLICT: " + JSON.stringify(payload.item));
            return { ...state, oldItem: payload.item };
        }

        case CONFLICT_SOLVED: {
            log("CONFLICT_SOLVED");
            return { ...state, oldItem: undefined };
        }

        case SAVE_ITEM_FAILED:
            return { ...state, savingError: payload.error, saving: false };

        case DELETE_ITEM_STARTED:

            return { ...state, deletingError: null, deleting: true };
        case DELETE_ITEM_SUCCEEDED: {
            const items = [...(state.items || [])];
            const item = payload.item;
            const index = items.findIndex((it) => it._id === item._id);
            items.splice(index, 1);
            return { ...state, items, deleting: false };
        }

        case DELETE_ITEM_FAILED:
            return { ...state, deletingError: payload.error, deleting: false };

        default:
            return state;
    }
};

export const ItemContext = React.createContext<ItemsState>(initialState);

interface ItemProviderProps {
    children: PropTypes.ReactNodeLike;
}

export const FlightProvider: React.FC<ItemProviderProps> = ({ children }) => {
    const { token, _id } = useContext(AuthContext);
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        items,
        fetching,
        fetchingError,
        saving,
        savingError,
        deleting,
        deletingError,
        oldItem
    } = state;
    useEffect(getItemsEffect, [token]);
    useEffect(wsEffect, [token]);

    const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);

    const deleteItem = useCallback<DeleteItemFn>(deleteItemCallback, [token]);

    const updateServer = useCallback<UpdateServerFn>(updateServerCallback, [
        token,
    ]);

    const getServerItem = useCallback<ServerItem>(itemServer, [token]);

    const value = {
        items,
        fetching,
        fetchingError,
        saving,
        savingError,
        saveItem,
        deleting,
        deleteItem,
        deletingError,
        updateServer,
        getServerItem,
        oldItem
    };


    log("returns");
    return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;


    async function itemServer(id:string, version:number){
        const oldItem = await getFlight(token,id);
        if (oldItem.version !== version){
            dispatch({type:CONFLICT, payload:{item:oldItem}});
        }
    }

    async function updateServerCallback() {
        const allKeys = Storage.keys();
        let promisedItems;
        var i;

        promisedItems = await allKeys.then(function (allKeys) {
            const promises = [];
            for (i = 0; i < allKeys.keys.length; i++) {
                const promiseItem = Storage.get({key: allKeys.keys[i]});

                promises.push(promiseItem);
            }
            return promises;
        });

        for (i = 0; i < promisedItems.length; i++) {
            const promise = promisedItems[i];
            const flight = await promise.then(function (it) {
                var object;
                try {
                    object = JSON.parse(it.value!);
                } catch (e) {
                    return null;
                }
                return object;
            });
            log("FLIGHT: " + JSON.stringify(flight));
            if (flight !== null) {
                if (flight.status === 1) {
                    dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: flight}});
                    await Storage.remove({key: flight._id});
                    const oldFlight = flight;
                    delete oldFlight._id;
                    oldFlight.status = 0;
                    const newFlight = await createFlight(token, oldFlight);
                    dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: newFlight}});
                    await Storage.set({
                        key: JSON.stringify(newFlight._id),
                        value: JSON.stringify(newFlight),
                    });
                } else if (flight.status === 2) {
                    flight.status = 0;
                    const newFlight = await updateFlight(token, flight);
                    dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: newFlight}});
                    await Storage.set({
                        key: JSON.stringify(newFlight._id),
                        value: JSON.stringify(newFlight),
                    });
                } else if (flight.status === 3) {
                    flight.status = 0;
                    await eraseFlight(token, flight);
                    await Storage.remove({key: flight._id});
                }
            }
        }
    }


    function getItemsEffect() {
        let canceled = false;
        fetchItems();
        return () => {
            canceled = true;
        };

        async function fetchItems() {
            if (!token?.trim()) {
                return;
            }
            try {
                log("fetchItems started");
                dispatch({type: FETCH_ITEMS_STARTED});
                const items = await getFlights(token);
                log("fetchItems succeeded");
                if (!canceled) {
                    dispatch({type: FETCH_ITEMS_SUCCEEDED, payload: {items}});
                }
            } catch (error) {
                const allKeys = Storage.keys();
                console.log(allKeys);
                let promisedItems;
                var i;

                promisedItems = await allKeys.then(function (allKeys) {

                    const promises = [];
                    for (i = 0; i < allKeys.keys.length; i++) {
                        const promiseItem = Storage.get({key: allKeys.keys[i]});

                        promises.push(promiseItem);
                    }
                    return promises;
                });

                const flights = [];
                for (i = 0; i < promisedItems.length; i++) {
                    const promise = promisedItems[i];
                    const flight = await promise.then(function (it) {
                        var object;
                        try {
                            object = JSON.parse(it.value!);
                        } catch (e) {
                            return null;
                        }
                        console.log(typeof object);
                        console.log(object);
                        if (object.status !== 2) {
                            return object;
                        }
                        return null;
                    });
                    if (flight != null) {
                        flights.push(flight);
                    }
                }

                const items = flights;
                dispatch({type: FETCH_ITEMS_SUCCEEDED, payload: {items: items}});
            }
        }
    }

    // function getItemsEffect() {
    //     let canceled = false;
    //     fetchItems();
    //     return () => {
    //         canceled = true;
    //     };
    //
    //     async function fetchItems() {
    //         if (!token?.trim()) {
    //             return;
    //         }
    //         try {
    //             log("fetchItems started");
    //             dispatch({ type: FETCH_ITEMS_STARTED });
    //             const items = await getFlights(token);
    //             log("fetchItems succeeded");
    //             if (!canceled) {
    //                 dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
    //             }
    //         } catch (error) {
    //             log("fetchItems failed");
    //             const allKeys = Storage.keys();
    //             let promisedItems;
    //             var i;
    //
    //             promisedItems = await allKeys.then(function (allKeys) {
    //                 const promises = [];
    //                 for (i = 0; i < allKeys.keys.length; i++) {
    //                     const promiseItem = Storage.get({key: allKeys.keys[i]});
    //
    //                     promises.push(promiseItem);
    //                 }
    //                 return promises;
    //             });
    //
    //             const flightItems = [];
    //             for (i = 0; i < promisedItems.length; i++) {
    //
    //                 const promise = promisedItems[i];
    //                 const flight = await promise.then(function (it) {
    //                     var object;
    //                     try {
    //                         object = JSON.parse(it.value);
    //                     } catch (e) {
    //                         return null;
    //                     }
    //                     if (object.userId === _id) {
    //                         return object;
    //                     }
    //                     return null;
    //                 });
    //                 if (flight != null) {
    //                     flightItems.push(flight);
    //                 }
    //             }
    //             const items = flightItems;
    //             dispatch({ type: FETCH_ITEMS_FAILED, payload: { items: items }});
    //         }
    //     }
    // }
    function random_id() {
        return "_" + Math.random().toString(36).substr(2, 9);
    }


    async function saveItemCallback(flight: FlightProps, connected: boolean) {
        try {
            if (!connected) {
                throw new Error();
            }
            log("saveItem started");
            dispatch({type: SAVE_ITEM_STARTED});
            const savedItem = await (flight._id
                ? updateFlight(token, flight)
                : createFlight(token, flight));

            log("saveItem succeeded");
            dispatch({type: SAVE_ITEM_SUCCEEDED, payload: {item: savedItem}});
            dispatch({type: CONFLICT_SOLVED});
        } catch (error) {
            log("saveItem failed with errror:", error);

            if (flight._id === undefined) {
                flight._id = random_id();
                flight.status = 1;
                //alert("Flight saved locally");
            } else {
                flight.status = 2;
                alert("Flight updated locally");
            }
            await Storage.set({
                key: flight._id,
                value: JSON.stringify(flight),
            });

            dispatch({type: SAVE_ITEM_SUCCEEDED_OFFLINE, payload: {item: flight}});
        }
    }
    // async function saveItemCallback(item: FlightProps) {
    //     try {
    //         log("saveItem started");
    //
    //         dispatch({ type: SAVE_ITEM_STARTED });
    //         const savedItem = await (item._id
    //             ? updateFlight(token, item)
    //             : createFlight(token, item));
    //         log("saveItem succeeded");
    //         dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
    //     } catch (error) {
    //         log("saveItem failed");
    //         await Storage.set({ key: JSON.stringify(item._id), value: JSON.stringify(item) });
    //         dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
    //     }
    // }

    async function deleteItemCallback(flight: FlightProps, connected: boolean) {
        try {
            if (!connected) {
                throw new Error();
            }
            dispatch({type: DELETE_ITEM_STARTED});
            const deletedItem = await eraseFlight(token, flight);
            console.log(deletedItem);
            await Storage.remove({key: flight._id!});
            dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: flight}});
        } catch (error) {

            flight.status = 3;
            await Storage.set({
                key: JSON.stringify(flight._id),
                value: JSON.stringify(flight),
            });
            alert("Flight deleted locally");
            dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: flight}});
        }
    }

    // async function deleteItemCallback(item: FlightProps) {
    //     try {
    //         log("delete started");
    //         dispatch({ type: DELETE_ITEM_STARTED });
    //         const deletedItem = await eraseFlight(token, item);
    //         log("delete succeeded");
    //         console.log(deletedItem);
    //         dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { item: item } });
    //     } catch (error) {
    //         log("delete failed");
    //         await Storage.set({key: JSON.stringify(item._id), value: JSON.stringify(item)});
    //         dispatch({type: DELETE_ITEM_SUCCEEDED, payload: {item: item}});
    //     }
    // }

    function wsEffect() {
        let canceled = false;
        log("wsEffect - connecting");
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(token, message => {
                if (canceled) {
                    return;
                }
                const { type, payload: item } = message;
                log(`ws message, item ${type}`);
                if (type === "created" || type === "updated") {
                  //dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
                }
            });
        }
        return () => {
            log("wsEffect - disconnecting");
            canceled = true;
            closeWebSocket?.();
        };
    }

};
