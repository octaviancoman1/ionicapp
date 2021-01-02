import React, {useContext, useState, useEffect} from "react";
import {RouteComponentProps} from "react-router";
import {Redirect} from "react-router-dom";

import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSelect,
    IonSelectOption,
    IonSearchbar, IonToast,
} from "@ionic/react";

import {add} from "ionicons/icons";
import Flight from "./Flight";
import {getLogger} from "../core";
import {ItemContext} from "./FlightProvider";
import {AuthContext} from "../auth";
import {FlightProps} from "./FlightProps";
import { useNetwork } from './useNetwork';

const log = getLogger('FlightList');

const FlightList: React.FC<RouteComponentProps> = ({history}) => {
    const {networkStatus} = useNetwork();

    const {items, fetching, fetchingError, updateServer  } = useContext(ItemContext);

    const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(
        false
    );
    const [filter, setFilter] = useState<string | undefined>(undefined);

    const [search, setSearch] = useState<string>("");

    const selectOptions = ["has seats", "does not have seats"];

    const [itemsShow, setItemsShow] = useState<FlightProps[]>([]);

    const [position, setPosition] = useState(10);

    const {logout} = useContext(AuthContext);

    const handleLogout = () => {
        logout?.();
        return <Redirect to={{pathname: "/login"}}/>;
    };

    useEffect(() => {
        if (networkStatus.connected) {
            updateServer && updateServer();
        }
    }, [networkStatus.connected]);


    useEffect(() => {
        if (items?.length) {
            setItemsShow(items.slice(0, 10));
        }
    }, [items]);
    log('render');

    async function searchNext($event: CustomEvent<void>) {
        if (items && position < items.length) {
           setItemsShow([...itemsShow, ...items.slice(position,position + 11)]);
           setPosition(position + 11);
        }else{
            setDisableInfiniteScroll(true);
        }
        ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    useEffect(() => {
        if (filter && items) {

            const boolType = filter === "has seats";

            let list: FlightProps[] = [];
            items.forEach((flight) => {

                let verify = false;
                if (flight.avaiableSeats > 0) verify = true;

                if (boolType === verify) {
                    list.push(flight);
                }
            })

            setItemsShow(list);

        }
    }, [filter,items]);


    useEffect(() => {
        if (search && items) {
            setItemsShow(items.filter((flight) => {
                if (search !== " ") {
                    return flight.destinationCity.startsWith(search)
                }else {
                    return true;
                }
            }).slice(0,10));
        }
    }, [search,items]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Flight Manager App</IonTitle>
                    <IonButton onClick={handleLogout}>Logout</IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonLoading isOpen={fetching} message="Fetching items"/>
                <IonSearchbar
                    value={search}
                    debounce={500}
                    onIonChange={(e) => {
                        if (e.detail.value!.length > 0) {
                            setSearch(e.detail.value!)
                        } else {
                            setSearch(" ")
                        }
                    }}
                ></IonSearchbar>

                <IonSelect
                    value={filter}
                    placeholder="Select flight that ...  "
                    onIonChange={(e) => setFilter(e.detail.value)}
                >
                    {selectOptions.map((option) => (
                        <IonSelectOption key={option} value={option}>
                            {option}
                        </IonSelectOption>
                    ))}
                </IonSelect>

                <div>Connected {JSON.stringify(networkStatus.connected)}</div>

                {itemsShow &&
                itemsShow.map((flight: FlightProps) => {
                    return (
                        <Flight
                            key={flight._id}
                            _id={flight._id}
                            destinationCity={flight.destinationCity}
                            departureCity={flight.departureCity}
                            price={flight.price}
                            date={flight.date}
                            avaiableSeats={flight.avaiableSeats}
                            userId={flight.userId}
                            status = {flight.status}
                            version={flight.version}
                            imgPath={flight.imgPath}
                            latitude={flight.latitude}
                            longitude={flight.longitude}
                            onEdit={(id) => history.push(`/item/${id}`)}
                        />
                    );
                })}
                <IonInfiniteScroll
                    threshold="100px"
                    disabled={disableInfiniteScroll}
                    onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}
                >
                    <IonInfiniteScrollContent loadingText="Loading more good doggos..."></IonInfiniteScrollContent>
                </IonInfiniteScroll>

                {fetchingError && (
                    <div>{fetchingError.message || "Failed to fetch items"}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push("/item")}>
                        <IonIcon icon={add}/>
                    </IonFabButton>
                </IonFab>

            </IonContent>
        </IonPage>
    );
};

export default FlightList;