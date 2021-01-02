import React, {useEffect, useState} from 'react';
import {createAnimation, IonModal, IonButton, IonContent} from '@ionic/react';
import '../style.css';

export const Modal: (props: { open: boolean, destination: string, departureCity: string, avaiableSeats: number, showModal: any })
    => JSX.Element = (props: { open: boolean, destination: string, departureCity: string, avaiableSeats: number, showModal: any }) => {
    const [showModal, setShowModal] = useState(props.open);

    const enterAnimation = (baseEl: any) => {
        const backdropAnimation = createAnimation()
            .addElement(baseEl.querySelector('ion-backdrop')!)
            .fromTo('opacity', '0.0', '0.4');

        const wrapperAnimation = createAnimation()
            .addElement(baseEl.querySelector('.modal-wrapper')!)
            .keyframes([
                {offset: 0, opacity: '0', transform: 'scale(0)'},
                {offset: 1, opacity: '0.99', transform: 'scale(1)'}
            ]);

        return createAnimation()
            .addElement(baseEl)
            .easing('ease-out')
            .duration(500)
            .addAnimation([backdropAnimation, wrapperAnimation]);
    }

    const leaveAnimation = (baseEl: any) => {
        return enterAnimation(baseEl).direction('reverse');
    }

    return (
        <>
            <IonModal isOpen={props.open} enterAnimation={enterAnimation} leaveAnimation={leaveAnimation} cssClass = 'modal'>
                <div>
                    <p>destination is {props.destination}</p>
                    <p>departure city is {props.departureCity}</p>
                    <p>this flight has {props.avaiableSeats} available seats</p>
                </div>
                <IonButton onClick={() => props.showModal(false)}>Close</IonButton>
            </IonModal>

        </>
    );
};