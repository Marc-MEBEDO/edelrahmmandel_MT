import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import React, { Fragment } from 'react';

import Modal from 'antd/lib/modal';
import message from 'antd/lib/message';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button';
import Divider from 'antd/lib/divider';
import Tooltip from 'antd/lib/tooltip';

import CloseOutlined from '@ant-design/icons/CloseOutlined';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import LikeOutlined from '@ant-design/icons/LikeOutlined';
import LikeTwoTone from '@ant-design/icons/LikeTwoTone';
import DislikeOutlined from '@ant-design/icons/DislikeOutlined'; 
import DislikeTwoTone from '@ant-design/icons/DislikeTwoTone';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';

import { Summernote } from './Summernote';
import { ActionCodeDropdown } from '../components/ActionCodeDropdown';
import { actionCodes } from '../../api/constData/actioncodes';

import { AppState, setAppState } from '../../client/AppState';

const IconText = ({ icon, text }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const MbacTooltip = props => {
    const { title, className, show, children } = props;

    if (show) return (
        <Tooltip className={className} title={title} >
            { children }
        </Tooltip>
    )
    
    return (
        <Fragment>
            { children }
        </Fragment>
    )
}

const FloatingActions = ({onSave, onCancel, onSocialClick, onCheckAnswer, onRemove, onFinallyRemove, isDeleted, isAnswer, likes, dislikes, canEdit = false, canFinallyRemove = false }) => {
    onSave = onSave || function(){};
    onCancel = onCancel || function(){};
    onCheckAnswer = onCheckAnswer || function(){};
    onSocialClick = onSocialClick || function(){};
    onRemove = onRemove || function(){};
    onFinallyRemove = onFinallyRemove || function(){};

    const doneBefore = arr => {
        const uid = Meteor.userId();
        
        return arr.filter( ({userId}) => userId == uid ).length > 0;
    }

    const listSocial = list => {
        return (
            <div className="mbac-tooltip-social-list">
                <ul className="ant-list">
                    {
                        list.map( ({userId, firstName, lastName}) => <li className="ant-list-item" key={userId}>{firstName + (firstName ? ' ':'') + lastName}</li>)
                    }
                </ul>
            </div> 
        );
    }

    return (
        <div className="mbac-floating-actions">

            <div className="mbac-additional-actions">
                <Space split={<Divider type="vertical" />}>
                    <MbacTooltip className="mbac-simple-social-list" title={listSocial(likes)} show={likes.length !== 0}>
                        <Space>
                            { doneBefore(likes)
                                ?<LikeTwoTone onClick={ e => onSocialClick('like') } />
                                :<LikeOutlined onClick={ e => onSocialClick('like') } />
                            }
                            <span>{likes.length}</span>
                        </Space>
                    </MbacTooltip>
                    <MbacTooltip className="mbac-simple-social-list" title={listSocial(dislikes)} show={dislikes.length !== 0} >
                        <Space>
                            { doneBefore(dislikes)
                                ?<DislikeTwoTone onClick={ e => onSocialClick('dislike') } />
                                :<DislikeOutlined onClick={ e => onSocialClick('dislike') } />
                            }
                            <span>{dislikes.length}</span>
                        </Space>
                    </MbacTooltip>

                    { canEdit && isAnswer ? <CheckOutlined onClick={onCheckAnswer} /> : null }
                    { canEdit ? (isDeleted ? <EyeInvisibleOutlined onClick={onRemove} /> : <EyeOutlined onClick={onRemove} />) : null }
                    
                    { canFinallyRemove ? <DeleteOutlined onClick={onFinallyRemove} /> : null }
                </Space>
            </div>
            <div className="mbac-primary-actions">
                { canEdit 
                    ?   <Space>
                            <Button type="dashed" icon={<CloseOutlined />} /*size="large"*/ onClick={onCancel}>Abbruch</Button>
                            <Button type="primary" icon={<CheckOutlined />} /*size="large"*/ onClick={onSave}>Speichern</Button>
                        </Space>
                    : <Button type="primary" onClick={onCancel}>OK</Button>
                }
            </div>
        </div>
    )
}

export class EditableContent extends React.Component {
    constructor(props) {
        super(props);

        // { item, type = 'span', className, value, method='opinionDetail.update', field, refDetail, permissions }
        this.state = {
            mode: 'SHOW'
        }

        const {item} = this.props;
        const {canEdit, canDelete} = this.props.permissions;

        this.inputRef = React.createRef();
    }

    componentDidUpdate() {
        const { type, value } = this.props;
        const { mode } = this.state;

        if (mode == 'EDIT') {
            if (type == 'wysiwyg') {
                this.inputRef.current.editor.summernote('code', value);
            } else if (type == 'span') {
                this.inputRef.current.innerText = value;
                this.inputRef.current.focus({cursor: 'all', preventScroll: true});
            } else if (type == 'actioncode') {
                // noop the ActionCodeDropdown will handle this via value prop
            }
        }
    }

    exitEditmode() {
        const { refDetail } = this.props;

        setAppState({ selectedDetail: null });
        //OLDAppState.selectedDetail = null;
        //OLDdelete AppState.selectedDetail;

        FlowRouter.withReplaceState(() => {
            FlowRouter.setQueryParams({activitiesBy: null});
        });

        this.setState({ mode: 'SHOW' });
    }

    toggleDeleted() {
        const { refDetail } = this.props;

        Meteor.call('opinionDetail.toggleDeleted', refDetail, (err, res) => {
            if (err) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            } else {
                this.exitEditmode();
            }
        });
    }

    finallyRemove() {
        const { refDetail } = this.props;
        
        Modal.confirm({
            title: 'Löschen',
            icon: <ExclamationCircleOutlined />,
            content: 'Soll der Eintrag wirklich gelöscht werden?',
            okText: 'OK',
            cancelText: 'Abbruch',
            onOk: closeConfirm => {
                closeConfirm();

                Meteor.call('opinionDetail.finallyRemove', refDetail, (err, res) => {
                    if (err) {
                        return Modal.error({
                            title: 'Fehler',
                            content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                        });
                    } else {
                        this.exitEditmode();
                    }
                });
            }
        });
    }

    checkAnswer() {
        const { refDetail } = this.props;

        Meteor.call('opinionDetail.checkAnswer', refDetail, (err, res) => {
            if (err) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            }
            this.exitEditmode();
        });
    }

    doSocial(action) {
        const { refDetail } = this.props;

        Meteor.call('opinionDetail.doSocial', action, refDetail, (err, res) => {
            if (err) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            }
        });
    }

    saveData() {
        const { type, refDetail, field, method = 'opinionDetail.update' } = this.props;
        const inp = this.inputRef.current;
        let newValue;
        
        if (type == 'wysiwyg') {
            newValue = inp.editor.summernote('code');
        } else if (type == 'span') {
            newValue = inp.innerText;
        } else if (type == 'actioncode') {
            newValue = inp.state.value;
        }
        
        // check for changes
        if (!this.isDirty()) return this.exitEditmode();

        if (!newValue) {
            inp.focus({cursor: 'all', preventScroll: true});
            return message.error('Die Eingabe darf nicht leer sein.');
        }

        Meteor.call(method, { id: refDetail, data: { [field]: newValue }}, err => {
            if (err) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            } else {
                this.setState({ mode: 'FOCUSED' });

                setAppState({
                    selectedDetail: {
                        _id: refDetail,
                        mode: 'FOCUSED',
                        discardChanges: this.discardChanges.bind(this),
                        saveData: this.saveData.bind(this),
                        isDirty: this.isDirty.bind(this)
                    }
                });        
            }
        });
    }

    isDirty() {
        const { type, value, field, refDetail } = this.props;
        const { mode } = this.state;

        if (mode != 'EDIT') return false;

        let newValue;
        const inp = this.inputRef.current;
        if (type == 'wysiwyg') {
            newValue = inp.editor.summernote('code');
        } else if (type == 'span') {
            newValue = inp.innerText;
        } else {
            newValue = inp.state.value;
        }

        // check for changes
        return (newValue !== value);
    }

    toggleMode() {
        const { refDetail, field, permissions, elementType } = this.props;
        const { mode } = this.state;
        const { canEdit } = permissions;

        if (AppState.selectedDetail && AppState.selectedDetail.mode == 'EDIT') {
            if (AppState.selectedDetail.isDirty()) {
                return message.error('Bitte schließen Sie die aktuelle Bearbeitung ab bevor sie eine neue Stelle beginnen zu Bearbeiten.');
            }
            AppState.selectedDetail.discardChanges();
        } else if (AppState.selectedDetail && AppState.selectedDetail.mode == 'FOCUSED') {
            AppState.selectedDetail.discardChanges();
        }

        const newMode = elementType === "Pagebreak" ? 'FOCUSED' : (canEdit ? 'EDIT':'FOCUSED');

        FlowRouter.withReplaceState(() => {
            FlowRouter.setQueryParams({activitiesBy: refDetail});
        });

        /*OLDAppState.selectedDetail = {
            _id: refDetail,
            mode: newMode,
            discardChanges: this.discardChanges.bind(this),
            saveData: this.saveData.bind(this),
            isDirty: this.isDirty.bind(this)
        }*/
        setAppState({
            selectedDetail: {
                _id: refDetail,
                mode: newMode,
                discardChanges: this.discardChanges.bind(this),
                saveData: this.saveData.bind(this),
                isDirty: this.isDirty.bind(this)
            }
        });

        this.setState({ mode: newMode });
    }

    discardChanges() {
        this.exitEditmode();
    }

    uploadImage(images, insertImage) {
        
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

    PasteFromClipboard(e) {
        const bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
        
        e.preventDefault();
        document.execCommand('insertText', false, bufferText);
    }


    render() {
        const { item, type, value, refDetail, permissions, elementType } = this.props;
        const { mode } = this.state;
        const { canEdit, canDelete } = permissions;

        const toggleMode = this.toggleMode.bind(this);
        const uploadImage = this.uploadImage.bind(this);
        const PasteFromClipboard = this.PasteFromClipboard.bind(this);

        const PreparedFloatingActions = <FloatingActions
            onSave={this.saveData.bind(this)} 
            onCancel={this.discardChanges.bind(this)}
            onCheckAnswer={this.checkAnswer.bind(this)}
            onRemove={this.toggleDeleted.bind(this)}
            onFinallyRemove={this.finallyRemove.bind(this)}
            onSocialClick={this.doSocial.bind(this)}
            isDeleted={item.deleted}
            isAnswer={item.type == 'ANSWER'}
            likes={item.likes}
            dislikes={item.dislikes}
            canEdit={elementType !== "Pagebreak" && canEdit}
            canFinallyRemove={canDelete}
        />;

        if (type == 'span') {
            if (mode == 'EDIT') {
                return (
                    <Fragment>
                        <Space>
                            <span ref={this.inputRef} className="mbac-editable-content" contentEditable="true" ></span>
                            { PreparedFloatingActions }
                        </Space>
                    </Fragment>
                )
            }

            return (
                <Fragment>
                    <span className={`mbac-could-styled-as-deleted ${mode=='FOCUSED'?'mbac-detail-focused':''}`} onClick={toggleMode}>{value}</span>
                    { mode === 'FOCUSED' ? PreparedFloatingActions : null }
                </Fragment>
            )
        } else if (type == 'wysiwyg') {
            if (mode == 'EDIT') {
                return (
                    <Fragment>
                        <Summernote
                            ref={this.inputRef}
                            className="mbac-editable-content mbac-wysiwyg"
                            onImageUpload={uploadImage}
                            onPaste={PasteFromClipboard}

                            options={{ airMode: true }}
                        />
                        { PreparedFloatingActions }
                    </Fragment>
                )
            }

            return (
                <div className={`mbac-could-styled-as-deleted ${mode=='FOCUSED'?'mbac-detail-focused':''}`}
                    onClick={toggleMode}
                    dangerouslySetInnerHTML={ {__html: value } }
                />
            )

        } else if (type == 'actioncode') {
            if (mode == 'EDIT') {
                return (
                    <Fragment>
                        <ActionCodeDropdown 
                            className="mbac-editable-content"
                            ref={this.inputRef}
                            refDetail={refDetail}
                            autoUpdate={false}
                            value={value}
                        />
                        { PreparedFloatingActions }
                    </Fragment>
                )
            }

            const actionCodeLongtext = actionCodes[value].longtext;
            return (
                <div className={`mbac-could-styled-as-deleted ${mode=='FOCUSED'?'mbac-detail-focused':''}`}
                    onClick={toggleMode}
                >
                    {actionCodeLongtext}
                </div>
            );
        }

        return <div>UNKNOWN type: {type}</div>;
    }
}