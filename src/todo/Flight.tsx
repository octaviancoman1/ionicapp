import React, {useState} from 'react';
import {IonButton, IonItem, IonLabel} from '@ionic/react';
import { FlightProps } from './FlightProps';
import {Modal} from "../animations/Modal";

interface ItemPropsExt extends FlightProps{
    onEdit: (_id?:string) => void;
}

const Flight: React.FC<ItemPropsExt> = ({_id,departureCity,destinationCity, avaiableSeats, imgPath, onEdit}) =>{
    const [showModal, setShowModal] = useState(false);
    return(
        <IonItem>
            <IonLabel  onClick = {() => onEdit(_id)}>{departureCity} {'->'} {destinationCity}</IonLabel>
            <IonButton onClick={() => {setShowModal(true); console.log("button clicked")}}>Flight details</IonButton>
            <Modal open={showModal} destination={destinationCity} departureCity={departureCity} avaiableSeats={avaiableSeats} showModal={setShowModal}/>
            <img src = {imgPath} style = {{height:50}} alt = "no image"/>
        </IonItem>
    );
};

export default Flight;