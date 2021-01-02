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
    IonDatetime, IonFabButton, IonFab, IonIcon, IonActionSheet
} from '@ionic/react';
import {getLogger} from '../core';
import {ItemContext} from './FlightProvider';
import {RouteComponentProps} from 'react-router';
import {FlightProps} from './FlightProps';
import {AuthContext} from "../auth";
import {useNetwork} from "./useNetwork";
import {Photo, usePhotoGallery} from "./useImageGallery";
import {camera, trash, close} from "ionicons/icons";
import {MapComponent} from "./MapComponent";

const log = getLogger('FlightEdit');

interface ItemEditProps extends RouteComponentProps<{
    id?: string;
}> {
}

export const FlightEdit: React.FC<ItemEditProps> = ({history, match}) => {
    const {items, saving, savingError, saveItem, deleteItem, getServerItem, oldItem} = useContext(ItemContext);
    const {networkStatus} = useNetwork();
    const [itemV2, setItemV2] = useState<FlightProps>();
    const [status, setStatus] = useState(1);
    const [version, setVersion] = useState(-100);
    const [departureCity, setdepartureCity] = useState('');
    const [destinationCity, setDestinationCity] = useState('');
    const [date, setDate] = useState('');
    const [price, setPrice] = useState(0);
    const [avaiableSeats, setAvaiableSeats] = useState(0);
    const [imgPath, setImgPath] = useState("");
    const [latitude, setLatitude] = useState(47.65371);
    const [longitude, setLongitude] = useState(24.548178);
    const [item, setItem] = useState<FlightProps>();
    const {_id} = useContext(AuthContext);
    const [userId, setUserId] = useState(_id);
    const {photos, takePhoto, deletePhoto} = usePhotoGallery();
    const [photoDeleted, setPhotoDeleted] = useState<Photo>();

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
            setStatus(item.status);
            setVersion(item.version);
            setImgPath(item.imgPath);
            if (item.latitude) setLatitude(item.latitude);
            if (item.longitude) setLongitude(item.longitude);
            getServerItem && getServerItem(match.params.id!, item?.version);
        }
    }, [match.params.id, items, getServerItem]);

    useEffect(() => {
        setItemV2(oldItem);
        log("setOldItem: " + JSON.stringify(oldItem));
    }, [oldItem]);

    const handleSave = () => {
        const editedItem = item ? {
            ...item,
            departureCity,
            destinationCity,
            date,
            price,
            avaiableSeats,
            userId,
            status: 0,
            version: item.version ? item.version + 1 : 1,
            imgPath,
            latitude,
            longitude
        } : {
            departureCity,
            destinationCity,
            date,
            price,
            avaiableSeats,
            userId,
            status: 0,
            version: 1,
            imgPath,
            latitude,
            longitude
        };
        saveItem && saveItem(editedItem, networkStatus.connected).then(() => {
            if (itemV2 === undefined) history.goBack();
        });
    };

    const handleConflict1 = () => {
        if (oldItem) {
            const editedItem = {
                ...item,
                departureCity,
                destinationCity,
                date,
                price,
                avaiableSeats,
                userId,
                status: 0,
                version: oldItem?.version + 1,
                imgPath,
                latitude,
                longitude
            };
            saveItem && saveItem(editedItem, networkStatus.connected).then(() => {
                history.goBack();
            });
        }
    };

    const handleConflict2 = () => {
        if (oldItem) {
            const editedItem = {
                ...item,
                departureCity: oldItem?.departureCity,
                destinationCity: oldItem?.destinationCity,
                date: oldItem?.date,
                price: oldItem?.price,
                avaiableSeats: oldItem?.avaiableSeats,
                userId: oldItem?.userId,
                status: oldItem?.status,
                version: oldItem?.version,
                imgPath: oldItem?.imgPath,
                latitude: oldItem?.latitude,
                longitude: oldItem?.longitude
            };
            saveItem && editedItem && saveItem(editedItem, networkStatus.connected).then(() => {
                history.goBack();
            });
        }
    };


    const handleDelete = () => {
        const deletedItem = item
            ? {
                ...item,
                departureCity,
                destinationCity,
                date,
                price,
                avaiableSeats,
                userId,
                status: 0,
                version: 0,
                imgPath,
                latitude,
                longitude
            }
            : {
                departureCity,
                destinationCity,
                date,
                price,
                avaiableSeats,
                userId,
                status: 0,
                version: 0,
                imgPath,
                latitude,
                longitude
            };
        deleteItem && deleteItem(deletedItem, networkStatus.connected).then(() => history.goBack());
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
                        onIonChange={(e) => setAvaiableSeats(Number(e.detail.value))}
                    />
                </IonItem>
                <IonItem>
                    <IonLabel>Price </IonLabel>
                    <IonInput
                        value={price}
                        onIonChange={(e) => setPrice(Number(e.detail.value))}
                    />
                </IonItem>
                <IonItem>
                    <IonLabel>Date: </IonLabel>
                    <IonDatetime value={date} onIonChange={e => setDate(String(e.detail.value))}></IonDatetime>
                </IonItem>
                <img src={item?.imgPath} alt="image2"/>
                <MapComponent
                    lat={latitude}
                    lng={longitude}
                    onMapClick={(location: any) => {
                        setLatitude(location.latLng.lat());
                        setLongitude(location.latLng.lng());
                    }}
                />
                {itemV2 && (
                    <>
                        <IonItem>
                            <IonLabel>Departure City: {itemV2.departureCity}</IonLabel>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Destination City: {itemV2.destinationCity}</IonLabel>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Date: {itemV2.date}</IonLabel>
                        </IonItem>

                        <IonItem>
                            <IonLabel>Price: {itemV2.price}</IonLabel>
                        </IonItem>

                        <IonItem>
                            <IonLabel>Available Seats: {itemV2.avaiableSeats}</IonLabel>
                        </IonItem>

                        <IonButton onClick={handleConflict1}>Choose your version</IonButton>
                        <IonButton onClick={handleConflict2}>Choose updated version</IonButton>
                    </>
                )}
                <IonLoading isOpen={saving}/>
                {savingError && (
                    <div>{savingError.message || "Failed to save item"}</div>
                )}
                <IonFab vertical="bottom" horizontal="center" slot="fixed">
                    <IonFabButton
                        onClick={() => {
                            const photoTaken = takePhoto();
                            photoTaken.then((data) => {
                                setImgPath(data.webviewPath!);
                            });
                        }}
                    >
                        <IonIcon icon={camera}/>
                    </IonFabButton>
                </IonFab>
                <IonActionSheet
                    isOpen={!!photoDeleted}
                    buttons={[
                        {
                            text: "Delete",
                            role: "destructive",
                            icon: trash,
                            handler: () => {
                                if (photoDeleted) {
                                    deletePhoto(photoDeleted);
                                    setPhotoDeleted(undefined);
                                }
                            },
                        },
                        {
                            text: "Cancel",
                            icon: close,
                            role: "cancel",
                        },
                    ]}
                    onDidDismiss={() => setPhotoDeleted(undefined)}
                />
            </IonContent>
        </IonPage>

    );

};
export default FlightEdit;