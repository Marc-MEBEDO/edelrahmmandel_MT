import { Meteor } from 'meteor/meteor';
import React, {Fragment, useState} from 'react';
import { 
    Button,
    Select,
    Modal,
    Form,
    Input,
    Switch,
} from 'antd';

import { PlusOutlined, EditOutlined } from '@ant-design/icons';

import { useTracker } from 'meteor/react-meteor-data';
import { Layouttypes } from '/imports/api/collections/layouttypes';
import { OpinionDetails } from '/imports/api/collections/opinionDetails';

import { Summernote } from '../components/Summernote';

const { Option } = Select;

import { ModalBackground, preventClickPropagation } from '../components/ModalBackground';

/*
const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 },
};

const tailLayout = {
    wrapperCol: {
        offset: 8,
        span: 16,
    },
};
*/
export const ModalOpinionDetail = ( { mode/*NEW||EDIT*/, refOpinion, refParentDetail, refDetail }) => {
    const { layouttypes, isLoadingLayouttypes } = useTracker(() => {
        const noDataAvailable = { layouttypes: [] };

        if (!Meteor.user()) {
          return noDataAvailable;
        }
        const handler = Meteor.subscribe('layouttypes');
    
        if (!handler.ready()) {
          return { ...noDataAvailable, isLoadingLayouttypes: true };
        }
    
        const layouttypes = Layouttypes.find({}).fetch();
        return { layouttypes, isLoadingLayouttypes: false };
    });

    const [ showModal, setShowModal ] = useState(false);

    const [form] = Form.useForm();

    const handleModalOk = e => {
        form.validateFields().then( values => {
            console.log(values);

            if (mode === 'NEW') {
                values.refOpinion = refOpinion;
                values.refParentDetail = refParentDetail;       
    
                Meteor.call('opinionDetail.insert', values, (err, res) => {
                    if (err) {
                        return Modal.error({
                            title: 'Fehler',
                            content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                        });
                    }
    
                    form.resetFields();
                    setShowModal(false);
                });
            } else if ( mode === 'EDIT' ) {
                Meteor.call('opinionDetail.update', { id: refDetail, data: values}, (err, res) => {
                    if (err) {
                        return Modal.error({
                            title: 'Fehler',
                            content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                        });
                    }
    
                    form.resetFields();
                    setShowModal(false);   
                });
            } else {
                throw new Error ('modals/opinionDetail mode prop should be "NEW" or "EDIT"');
            }
        }).catch( info => {
            //console.log('Validate Failed:', info);
        });
    }

    const handleModalCancel = e => {
        form.resetFields();
        setShowModal(false);
    }

    const showModalVisible = (e) => {
        // prevent collapse-trigger to react/launch
        e.stopPropagation();

        if (mode === 'EDIT') {
            const od = OpinionDetails.find(refDetail).fetch();

            if (!od && !od[0]) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein Fehler beim Lesen der Gutachtendetails aufgetreten. ' + err.message
                });
            }
            
            setTimeout( _ => {
                form.setFieldsValue({
                    orderString: od[0].orderString,
                    title: od[0].title,
                    printTitle: od[0].printTitle,
                    type: od[0].type,
                    text: od[0].text || '',
                    showInToC: od[0].showInToC
                });
            }, 100);
        }

        setShowModal(true);
    }

    const uploadImage = function(images, insertImage) {
        console.log('onImageUpload', images);
        /* FileList does not support ordinary array methods */
        for (let i = 0; i < images.length; i++) {
            /* Stores as bas64enc string in the text.
             * Should potentially be stored separately and include just the url
             */
            const reader = new FileReader();

            reader.onloadend = () => {
                insertImage(reader.result);
            };

            reader.readAsDataURL(images[i]);
        }
    }
    
    const ActionButton = () => {
        if (mode === "EDIT") {
            return (
                <Button type="primary" onClick={ showModalVisible }><EditOutlined  />Bearbeiten</Button>
            );
        } else {
            return (
                <Button
                    style={{marginTop:24}}
                    type="dashed" block
                    icon={<PlusOutlined />}
                    onClick={ showModalVisible }>
                        Erstellen eines neuen Detailpunkt
                </Button>
            )
        }
    }

    const handlePaste = e => {
        const bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
        
        e.preventDefault();
        document.execCommand('insertText', false, bufferText);
    }

    return (
        <Fragment>
            <ActionButton />

            { !showModal ? null :
                <ModalBackground>
                    <Modal
                        title="Neue Details zum Gutachten"
                        width="80%"
                        visible={ showModal }
                        onOk={ handleModalOk }
                        onCancel={ handleModalCancel }
                        maskClosable={false}
                        onClick={ preventClickPropagation }
                    >
                        <p>Zum Erstellen neuer Details zu diesem Gutachten füllen Sie bitte die nachfolgenden Felder aus und bestätigen Sie den Dialog mit OK.</p>

                        <Form
                            //{...layout}
                            layout="vertical"
                            form={form}
                            onFinish={handleModalOk}
                        >
                            <Form.Item
                                label="Sortierung"
                                name="orderString"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie einen Wert für die Sortierung an.',
                                    },
                                ]}
                            >
                                <Input placeholder="Sortierung" style={{width:150}}/>
                            </Form.Item>

                            <Form.Item
                                label="Nennung im Inhaltsverzeichnis"
                                name="showInToC"
                                /*rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie einen Wert an.',
                                    },
                                ]}*/
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>

                            <Form.Item
                                label="Typ"
                                name="type"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie einen Typ an.',
                                    },
                                ]}
                            >
                                <Select style={{ width: 360 }} loading={isLoadingLayouttypes}>
                                    { layouttypes.map (t => <Option key={t._id} value={t._id}>{t.title}</Option>) } 
                                </Select>
                            </Form.Item>

                            <Form.Item
                                label="Titel"
                                name="title"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Bitte geben Sie einen Namen für das Gutachten ein.',
                                    },
                                ]}
                            >
                                <Input placeholder="Eindeutiger Titel des Gutachtendetails"/>
                            </Form.Item>

                            <Form.Item
                                label="abw. Titel (im Druck)"
                                name="printTitle"
                            >
                                <Input placeholder="Nur einzugeben wenn dieser im Druck abweichend ist zum o.g. Titel"/>
                            </Form.Item>

                            <Form.Item
                                label="Text"
                                name="text"
                            >
                                <Summernote
                                    className="summernote-airmode"
                                    onImageUpload={uploadImage}
                                    onPaste={handlePaste}
                                    options={ { airMode: true } }
                                />
                                
                            </Form.Item>
                        </Form>
                    </Modal>
                </ModalBackground>
            }
        </Fragment>
    );
}