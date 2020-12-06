import React, {useContext, useEffect, useState} from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput, IonItem,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonDatetime
} from '@ionic/react';
import {getLogger} from '../core';
import {ItemContext} from './FlightProvider';
import {RouteComponentProps} from 'react-router';
import {FlightProps} from './FlightProps';
import {AuthContext} from "../auth";

const log = getLogger('FlightEdit');

interface ItemEditProps extends RouteComponentProps<{
    id?: string;
}> {
}

export const FlightEdit: React.FC<ItemEditProps> = ({history, match}) => {
    const {items, saving, savingError, saveItem, deleteItem} = useContext(ItemContext);
    const [departureCity, setdepartureCity] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [date, setDate] = useState('');
    const [price, setPrice] = useState(0);
    const [avaiableSeats, setAvaiableSeats] = useState(0);
    const [item, setItem] = useState<FlightProps>();
    const { _id } = useContext(AuthContext);
    const [userId, setUserId] = useState(_id);
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const item = items?.find((it) => it._id === routeId);
        setItem(item);
        if (item) {
            setdepartureCity(item.departureCity);
            setDestinationCity(item.destinationCity);
            setDate(item.date);
            setPrice(item.price);
            setAvaiableSeats(item.avaiableSeats);

        }
    }, [match.params.id, items]);
    const handleSave = () => {
        const editedItem = item ? {
            ...item,
            departureCity,
            destinationCity,
            date,
            price,
            avaiableSeats,
            userId
        } : {departureCity, destinationCity, date, price,avaiableSeats,userId };
        saveItem && saveItem(editedItem).then(() => history.goBack());
    };

    const handleDelete = () => {
        const deletedItem = item
            ? {...item, departureCity, destinationCity, date, price, avaiableSeats,userId}
            : {departureCity, destinationCity, date, price,avaiableSeats,userId};
        deleteItem && deleteItem(deletedItem).then(() => history.goBack());
    };
    log('render');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>Save</IonButton>
                        <IonButton onClick={handleDelete}>Delete</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonItem>
                    <IonLabel>Departure City: </IonLabel>
                    <IonInput
                        value={departureCity}
                        onIonChange={(e) => setdepartureCity(e.detail.value || "")}
                    />
                </IonItem>
                <IonItem>
                    <IonLabel>Destination city: </IonLabel>
                    <IonInput
                        value={destinationCity}
                        onIonChange={(e) => setDestinationCity(e.detail.value || "")}
                    />
                </IonItem>
                <IonItem>
                    <IonLabel>Avaiable seats: </IonLabel>
                    <IonInput
                        value={avaiableSeats}
                        onIonChange={(e) => setAvaiableSeats(Number(e.detail.value) )}
                    />
                </IonItem>
                <IonItem>
                    <IonLabel>Price </IonLabel>
                    <IonInput
                        value={price}
                        onIonChange={(e) => setPrice(Number(e.detail.value) )}
                    />
                </IonItem>
                <IonItem>
                    <IonLabel>Date: </IonLabel>
                    <IonDatetime value={date} onIonChange={e => setDate(String(e.detail.value))}></IonDatetime>
                </IonItem>
                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || "Failed to save item"}</div>
                )}
            </IonContent>
        </IonPage>
    );
};
export default FlightEdit;