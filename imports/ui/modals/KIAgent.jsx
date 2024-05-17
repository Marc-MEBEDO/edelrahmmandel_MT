import React, { Fragment, useState } from 'react';
import { ModalBackground } from '../components/ModalBackground';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import RocketOutlined from '@ant-design/icons/RocketOutlined';
import Tooltip from 'antd/lib/tooltip';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Divider from 'antd/lib/divider';

import CopyOutlined from '@ant-design/icons/CopyOutlined';
import CheckSquareOutlined from '@ant-design/icons/CheckSquareOutlined';

const { useForm } = Form;
const { TextArea } = Input;

//Modales KI Fenster zur Befragung unserer KI.
export const ModalKIAgent = ( { initText , refOpinion }) => {
    const [ showModal, setShowModal ] = useState( false );
    const [ form ] = useForm();
    const [ inputValue , setInputValue ] = useState( initText );
    const [ outputValue , setOutputValue ] = useState( '' );
    const [ pendingKIAnswer, setPendingKIAnswer] = useState(false);
    const [ isCopied , setIsCopied]  = useState( false );


    const handleInputChange = (e) => {
        setInputValue( e.target.value );
      };

    const closeModal = e => {
        setShowModal(false);
    }

    const showModalVisible = (e) => {
        e.stopPropagation();        

        setShowModal(true);
    }

    const ActionButton = () => {
        return (
            <Tooltip title="Unsere KI befragen">
                <RocketOutlined onClick={ showModalVisible } />
            </Tooltip>
        )
    }

    const AskKI = async () => {
        try {
            setOutputValue( '' );
            setPendingKIAnswer( true );
            let KIAnswer = await Meteor.callAsync( 'ki.sendQuestionToKIAgent' , inputValue , refOpinion );
            //console.log( 'KIAnswer: ' + KIAnswer );
            setOutputValue( KIAnswer );
            setPendingKIAnswer( false );
        }
        catch ( err ) {
            setOutputValue( '' );
            console.log( err );
        }
    }

    const copyOutputText = () => {
        navigator.clipboard.writeText( outputValue );
    
        setIsCopied( true );
        setTimeout(() => {
          setIsCopied(false);
        }, 1000);
      };


    return ( 
        <Fragment>
            <ActionButton />
            
            { !showModal ? null :
                <ModalBackground>
                    <Modal
                        className="mbac-modal-upload-pictures"
                        title="Befrage unsere KI"
                        open={ showModal }
                        onOk={ closeModal }
                        onCancel={ closeModal }
                        cancelButtonProps={{className:"mbac-btn-cancel"}}
                        okText="Schließen"
                        maskClosable={false}
                    >
                    
                    <Form
                        layout="vertical"
                        form={form}
                        onFinish={closeModal}
                    >
                        <Form.Item
                            label="Frage an unsere KI"
                            name="KIInput"
                        >
                            <TextArea rows={3} defaultValue={ inputValue } onChange={ handleInputChange } />
                        </Form.Item>
                        
                        <Button onClick={_=>AskKI()} loading={pendingKIAnswer}>Frage senden</Button>
                        <Divider />
                        
                        
                        <TextArea rows={10} disabled={true} value={ outputValue }/>

                        <Button
                                type="primary"
                                htmlType="button"
                                icon={isCopied ? <CheckSquareOutlined /> : <CopyOutlined />}
                                onClick={copyOutputText}
                            >KI Ausgabe kopieren</Button>
                    </Form>
                    
                    </Modal>
                </ModalBackground>
            }
        </Fragment>
    );
};