import React, {useContext, useEffect, useState} from 'react';
import {Redirect} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {IonButton, IonContent, IonHeader, IonInput, IonLoading, IonPage, IonTitle, IonToolbar} from '@ionic/react';
import {AuthContext} from './AuthProvider';
import {getLogger} from '../core';
import {createAnimation} from "@ionic/react";
import '../style.css';

const log = getLogger('Login');

interface LoginState {
    username?: string;
    password?: string;
}

export const Login: React.FC<RouteComponentProps> = ({history}) => {
        const {isAuthenticated, isAuthenticating, login, authenticationError} = useContext(AuthContext);
        const [state, setState] = useState<LoginState>({});
        const {username, password} = state;

        useEffect(() => {
            async function chainedAnimations() {

                const divUsername = createAnimation()
                    .addElement(document.getElementsByClassName("input username")[0])
                    .fill('none')
                    .duration(1000)
                    .iterations(1)
                    .fromTo('transform', 'translateX(300px)', 'translateX(0px)')


                const divPass = createAnimation()
                    .addElement(document.getElementsByClassName("input password")[0])
                    .fill('none')
                    .duration(1000)
                    .iterations(1)
                    .fromTo('transform', 'translateX(300px)', 'translateX(0px)')


                const divButton = createAnimation()
                    .addElement(document.getElementsByClassName("input btn")[0])
                    .fill('none')
                    .duration(1000)
                    .iterations(1)
                    .fromTo('transform', 'translateX(300px)', 'translateX(0px)')
                await divUsername.play();
                await divPass.play();
                await divButton.play();
            }

            chainedAnimations();
        }, []);


        const handleLogin = () => {
            log('handleLogin...');
            login?.(username, password);
        };
        log('render');
        if (isAuthenticated) {
            return <Redirect to={{pathname: '/'}}/>
        }
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Login</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div className={"input username"}>
                        <IonInput
                            placeholder="Username"
                            value={username}
                            onIonChange={e => setState({
                                ...state,
                                username: e.detail.value || ''
                            })}/>
                    </div>
                    <div className={"input password"} >
                        <IonInput
                            placeholder="Password"
                            value={password}
                            onIonChange={e => setState({
                                ...state,
                                password: e.detail.value || ''
                            })}/>
                    </div>
                    <IonLoading isOpen={isAuthenticating}/>
                    {authenticationError && (
                        <div>{authenticationError.message || 'Failed to authenticate'}</div>
                    )}
                    <div>
                        <IonButton className={"input btn"} onClick={handleLogin}>Login</IonButton>
                    </div>
                </IonContent>
            </IonPage>
        );
    }
;
