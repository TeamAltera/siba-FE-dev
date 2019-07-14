import React, { Component, Fragment } from 'react';
import {
    SibaFrame,
    SibaHeader,
    SideBar,
    AdminPallet
} from 'components';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import * as authActions from 'store/modules/auth';
import * as basicActions from 'store/modules/basic';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import { API_BASE_URL, ACCESS_TOKEN } from 'constants/index';
import axios from 'axios';
import { Terminal } from 'xterm'
import {fit} from 'xterm/lib/addons/fit/fit';
import 'xterm/dist/xterm.css'
import socketIOClient from 'socket.io-client'
import LocalEchoController from 'local-echo';

class HomeAdmin extends Component {

    // _checkUser = () => {
    //     const tokenValue = localStorage.getItem(ACCESS_TOKEN)
    //     if (tokenValue) {
    //         const { authActions } = this.props;
    //         axios.defaults.headers.common.Authorization = 'Bearer ' + tokenValue;
    //         authActions.kakaoAuth().then(() => {
    //             this._stompConnection(tokenValue);
    //         })
    //         authActions.setToken(tokenValue);
    //         return;
    //     }

    //     if (!this.props.token) {
    //         this.props.history.push('/')
    //     }
    // }

    _createTerminal = () => {

        if(this._xterm){
            this._xterm.dispose();
        }

        const {userState} = this.props

        const providerId = userState.getIn(['user', 'providerId'])

        //const protocol = (window.location.protocol === 'https:') ? 'wss://' : 'ws://';
        //let socketURL = `${protocol}${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/terminals/`

        const term = new Terminal({
            cursorBlink: true,
            fontFamily: 'Ubuntu Mono, courier-new, courier, monospace',
            fontSize: 12,
            rows: 40,
            cols: 80,
            theme: {
                background: '#212121',
            }
        });
        this._xterm = term;
        term.open(this.termElem);
        term.focus();
        fit(term)

        const localEcho = new LocalEchoController(term); //local-echo 생성

        term.write('*** establish to your SIBA IoT Hub ***\r\n\r\n');

        const socket = socketIOClient('http://192.168.0.7:3000')
        
        socket.on('connect', ()=>{

            let commandHeader = null;

            socket.emit("createNewServer", {
                msgId: providerId, 
                ip: "192.168.79.100", 
                username: "lss", 
                password: "PassW0rd"
            });

            term.write('\x1bc');

            term.write(' ________  ___  ________  ________     \r\n')
            term.write('|\\   ____\\|\\  \\|\\   __  \\|\\   __  \\   \r\n')
            term.write('\\ \\  \\___|\\ \\  \\ \\  \\|\\ /\\ \\  \\|\\  \\   \r\n')
            term.write(' \\ \\_____  \\ \\  \\ \\   __  \\ \\   __  \\  \r\n')
            term.write('  \\|____|\\  \\ \\  \\ \\  \\|\\  \\ \\  \\ \\  \\ \r\n')
            term.write('    ____\\_\\  \\ \\__\\ \\_______\\ \\__\\ \\__\\\r\n')
            term.write('   |\\_________\\|__|\\|_______|\\|__|\\|__|\r\n')
            term.write('   \\|_________|                        \r\n\r\n')

            term.write('connected your SNS & IoT Based on AI Chatbot hub [192.168.0.21]\r\n');

            //client -> hub
            /*term.on('key', (key, ev)=>{
                console.log(key.charCodeAt(0))
                if(key.charCodeAt(0) === 13){
                    term.write('\n');
                    socket.emit(providerId, key);
                }
                term.write(key);
                //term.write(data)
            })*/

            //hub -> client
            socket.on(providerId,(data)=>{
                localEcho.print(data);
                //let arr = data.split('\n');
                localEcho.read()
                .then(input => {
                    console.log(input)
                    socket.emit(providerId, input)
                })
                .catch(error => alert(`Error reading: ${error}`));
            })

            //disconnect
            socket.on('disconnect',()=>{
                term.write('connection is failed\r\n');
            })
        })
    }

    _setRef = (ref) => {
        this.termElem = ref;
    }

    _sbToggle = () => {
        const { basicActions, sb } = this.props;
        basicActions.sbToggle(sb);
    }

    componentDidMount() {
        this._createTerminal();
        //this._checkUser();
    }

    render() {

        const {
            sb,
            deviceAddBox,
            deviceWorkBox,
            userState,
            location } = this.props;

        return (
            <Fragment>
                <SibaFrame>
                    <ToastContainer
                        hideProgressBar={true}
                        autoClose={8000}
                        newestOnTop={true}
                    />
                    <SibaHeader userState={userState}></SibaHeader>
                    <SideBar
                        location={location}
                        deviceList={userState.get('deviceInfo')}
                        sbToggle={this._sbToggle}
                        sbState={sb}
                        deviceAddBox={deviceAddBox}
                        deviceWorkBox={deviceWorkBox}
                        deviceWorkBoxChangeFunc={this._deviceWorkBoxChange}
                        hubList={userState.get('hubInfo')}>
                    </SideBar>
                    <AdminPallet sbState={sb} setRef={this._setRef}>

                    </AdminPallet>
                </SibaFrame>
            </Fragment>
        )
    }
}


export default withRouter(
    connect(
        // props 로 넣어줄 스토어 상태값
        state => ({
            sb: state.basic.getIn(['frameState', 'sb']),
            userState: state.auth.get('userState'),
            deviceAddBox: state.basic.getIn(['frameState', 'deviceAddBox']),
            deviceWorkBox: state.basic.getIn(['frameState', 'deviceWorkBox']),
        }),
        // props 로 넣어줄 액션 생성함수
        dispatch => ({
            basicActions: bindActionCreators(basicActions, dispatch),
            authActions: bindActionCreators(authActions, dispatch),
        })
    )(HomeAdmin)
)