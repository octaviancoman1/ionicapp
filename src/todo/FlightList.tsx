import React, {useContext } from "react";
import {RouteComponentProps} from "react-router";

import{
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonList,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar
} from "@ionic/react";

import {add} from "ionicons/icons";
import Flight from "./Flight";
import {getLogger} from "../core";
import {ItemContext} from "./FlightProvider";

const log = getLogger('FlightList');

const FlightList: React.FC<RouteComponentProps> = ({ history }) => {
    const { items, fetching, fetchingError } = useContext(ItemContext);
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Flight Manager App</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonLoading isOpen={fetching} message="Fetching items" />
                {items && (
                    <IonList>
                        {items.map(({ _id, departureCity,destinationCity,date,price,avaiableSeats}) =>
                            <Flight
                                key={_id}
                                _id={_id}
                                departureCity={departureCity}
                                destinationCity={destinationCity}
                                date={date}  price={price}
                                avaiableSeats={avaiableSeats}
                                onEdit={(id) => history.push(`/item/${id}`)} />)}
                    </IonList>
                )}

                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch items'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/item')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default FlightList;