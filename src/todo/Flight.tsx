import React from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import { FlightProps } from './FlightProps';

interface ItemPropsExt extends FlightProps{
    onEdit: (_id?:string) => void;
}

const Flight: React.FC<ItemPropsExt> = ({_id,departureCity,destinationCity, imgPath, onEdit}) =>{
    return(
        <IonItem onClick = {() => onEdit(_id)}>
            <IonLabel>{departureCity} {'->'} {destinationCity}</IonLabel>
            <img src = {imgPath} style = {{height:50}} alt = "image"/>
        </IonItem>
    );
};

export default Flight;