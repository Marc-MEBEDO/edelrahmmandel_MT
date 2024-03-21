import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import { OpinionDetails } from '../api/collections/opinionDetails';
import { Opinions } from '../api/collections/opinions';
import { Roles } from '../api/collections/roles';
import { Activities } from '../api/collections/activities';
import { UserActivities } from '../api/collections/userActivities';
import { Images } from '../api/collections/images';
import { Layouttypes } from '../api/collections/layouttypes';
import { OpinionPdfs } from '../api/collections/opinion-pdfs';
import { Avatars } from '../api/collections/avatars';

import { ServiceMaintenances } from '../api/collections/serviceMaintenances';

export const useOpinionSubscription = id => useTracker( () => {
    const subscription = Meteor.subscribe('opinions', id)
    return !subscription.ready();
});

/**
 * Reactive current User Account
 */
export const useAccount = () => useTracker(() => {
    const user = Meteor.user();
    const userId = Meteor.userId();

    const subscription = Meteor.subscribe('currentUser');
    let currentUser = null;

    if (subscription.ready()) {
        currentUser = Meteor.users.findOne({_id:userId}, { fields: { username: 1, userData: 1 }});
    }
    let hasAdminRole = false;
    if ( currentUser )
    {
        currentUser.userData.roles.forEach( role => {
            if ( role === 'ADMIN' )
                hasAdminRole = true;
        });
    }

    return {
        user,
        userId,
        currentUser,
        isLoggedIn: !!userId,
        accountsReady: user !== undefined && subscription.ready(),
        hasAdminRole
    }
}, [])

/**
 * Load all users for administration reactively
 * 
 */
export const useAllUsersForAdmin = () => useTracker( () => {
    const noDataAvailable = [ [] /*users*/,  true /*loading*/ ];

    if (!Meteor.user()) {
        return noDataAvailable;
    }

    const handler = Meteor.subscribe('allUsersforAdmin');
    if (!handler.ready()) {
        return noDataAvailable;
    }

    const usrs = Meteor.users.find({}).fetch();
    //const users = users.find({}, { sort: { opinionNo: -1 } }).fetch();

    return [usrs, false];
});

/**
 * Reactive Roles handling
 * 
 */
export const useRoles = () => useTracker( () => {
    const noDataAvailable = [ [] /*Roles*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const subscription = Meteor.subscribe('roles');

    if (!subscription.ready()) { 
        return noDataAvailable;
    }

    const roles = Roles.find({}, { sort: {title: 1}}).fetch();

    return [roles, false];
});

/**
 * Reactive Layouttypes
 * 
 */
export const useLayouttypes = () => useTracker( () => {
    const noDataAvailable = [ [] /*Layouttypes*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const subscription = Meteor.subscribe('layouttypes');

    if (!subscription.ready()) { 
        return noDataAvailable;
    }

    const layouttypes = Layouttypes.find({}).fetch();

    return [layouttypes, false];
});

/**
 * Reactive ServiceMaintenances
 * 
 */
export const useServiceMaintenances = () => useTracker( () => {
    const noDataAvailable = [ [] , true /*loading*/];
    if (!Meteor.user()) {
        return noDataAvailable;
    }
    
    const subscription = Meteor.subscribe('servicemaintenances');
    if (!subscription.ready()) { 
        return noDataAvailable;
    }
    
    const servicemaintenances = ServiceMaintenances.findOne({active:true},{ sort: { dateStart: -1 } });
    
    return [servicemaintenances, false];
});


/**
 * Load the Opinion by its ID reactively
 * 
 * @param {String} refOpinion Id of the Opinion
 */
export const useOpinion = refOpinion => useTracker( () => {
    const noDataAvailable = [ null /*opinion*/,  true /*loading*/ ];

    if (!Meteor.user()) {
        return noDataAvailable;
    }

    const handler = Meteor.subscribe('opinions', refOpinion)
    if (!handler.ready()) {
        return noDataAvailable;
    }

    const opinion = Opinions.findOne(refOpinion);

    return [opinion, false];
}, [refOpinion]);

/**
 * Load all Opinions reactively
 * 
 */
export const useOpinions = () => useTracker( () => {
    const noDataAvailable = [ [] /*opinions*/,  true /*loading*/ ];

    if (!Meteor.user()) {
        return noDataAvailable;
    }

    const handler = Meteor.subscribe('opinions');
    if (!handler.ready()) {
        return noDataAvailable;
    }

    const opinions = Opinions.find({}, { sort: { opinionNo: -1 } }).fetch();

    return [opinions, false];
});

/**
 * Load the given OpinionDetail reactivly.
 * 
 * @param {String} refOpinion   id of the Opinion
 * @param {String} refDetail    id of the OpinionDetail
 */
export const useOpinionDetail = (refOpinion, refDetail) => useTracker( () => {
    const noDataAvailable = [ null /*opinionDetail*/,  true /*loading*/ ];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    // Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
//    const handler = Meteor.subscribe('opinionDetail', { refOpinion, refDetail });
const handler = Meteor.subscribe('opinionDetailAsync', { refOpinion, refDetail });

    if (!handler.ready()) {
        return noDataAvailable;
    }

    detail = OpinionDetails.findOne(refDetail);

    return [detail, false];
}, [refOpinion, refDetail]);


/**
 * Load the given OpinionDetail reactivly.
 * 
 * @param {String} refOpinion   id of the Opinion
 * @param {String} refDetail    id of the OpinionDetail
 * @param {Function} callback    Function that will be invoked at rerun
 */
export const useOpinionDetails = (refOpinion, refParentDetail, callback) => useTracker( () => {
    const noDataAvailable = [ [] /*opinionDetails*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    // Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
    //const handler = Meteor.subscribe('opinionDetails', { refOpinion, refParentDetail });
    const handler = Meteor.subscribe('opinionDetailsAsync', { refOpinion, refParentDetail });

    if (!handler.ready()) { 
        return noDataAvailable;
    }

    let opinionDetails;
    if (refParentDetail) {
        opinionDetails = OpinionDetails.find({ refParentDetail }, { sort: {position: 1}}).fetch();
    } else {
        opinionDetails = OpinionDetails.find({ refOpinion, refParentDetail: null }, { sort: {position: 1}}).fetch();
    }

    if (callback) callback(opinionDetails);

    return [opinionDetails, false];
}, [refOpinion, refParentDetail]);

/**
 * Load the given OpinionDetail that are not spellchecked yet.
 * 
 * @param {String} refOpinion   id of the Opinion
 */
 export const useOpinionDetailsSpellcheck = refOpinion => useTracker( () => {
    const noDataAvailable = [ [] /*opinionDetails*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    // Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
    //const handler = Meteor.subscribe('opinionDetailsSpellcheck', { refOpinion });
    const handler = Meteor.subscribe('opinionDetailsSpellcheckAsync', { refOpinion });

    if (!handler.ready()) { 
        return noDataAvailable;
    }

    const opinionDetails = OpinionDetails.find({ 
        $and: [
            { refOpinion }, 
            { deleted: false },
            { finallyRemoved: false },
            { type: { $nin: ['PAGEBREAK', 'TODOLIST', 'TODOITEM', 'TODOITEMACTIONHEAD'] }},
            { 
                $or: [
                    { spellchecked: false },
                    { spellchecked: { $exists: false } }
                ]
            }
        ]
    }, { sort: { printParentPosition:1, printPosition:1 }}).fetch();
    //{ sort: { printParentPosition:1 }}).fetch();
    //}, { sort: { printParentPosition:1 }}).collation({locale: "en_US", numericOrdering: true}).fetch();
    //}, { sort: { printParentPosition:1, printPosition:1, depth:1 }}).fetch();
    //.collation({locale: "en_US", numericOrdering: true})

    return [opinionDetails, false];
}, [refOpinion]);

/**
 * Load Activities reactivly for a given opinion or opinionDetail
 * 
 * @param {String} refOpinion   id of the Opinion
 * @param {String} refDetail    id of the OpinionDetail
 */
export const useActivities = (refOpinion, refDetail) => useTracker( () => {
    const noDataAvailable = [ [] /*activities*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    // Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
    //const subscription = Meteor.subscribe('activities', { refOpinion, refDetail });
    const subscription = Meteor.subscribe('activitiesAsync', { refOpinion, refDetail });

    if (!subscription.ready()) {
        return noDataAvailable;
    }

    let activities;
    if (refDetail) {
        activities = Activities.find({ refDetail }, { sort: { createdAt: 1}}).fetch();
    } else {
        activities = Activities.find({ refOpinion, refDetail: null }, { sort: { createdAt: 1} }).fetch();
    }

    return [ activities, false ];
}, [refOpinion, refDetail]);


/**
 * Returns the count of unread user-activities reactively
 * 
 */
export const useUserActivityCount = () => useTracker( () => {
    const noDataAvailable = [ null , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const subscription = Meteor.subscribe('userActivities');

    if (!subscription.ready()) {
        return noDataAvailable;
    }

    const count = UserActivities.find({ unread: true }).count();

    return [ count, false ];
}, []);

/**
 * Load the userActivities reactivly
 * 
 * @param {String} refOpinion   id of the Opinion
 * @param {String} refDetail    id of the OpinionDetail
 */
export const useUserActivities = ({orderBy}) => useTracker( () => {
    const noDataAvailable = [ [] /*activities*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const subscription = Meteor.subscribe('userActivities');

    if (!subscription.ready()) {
        return noDataAvailable;
    }

    const sort = orderBy || { createdAt: 1};
    return [
        UserActivities.find({}, { sort }).fetch(),
        false
    ];
});


/**
 * Load the userActivities reactivly
 * 
 * @param {String} refOpinion   id of the Opinion
 * @param {String} refDetail    id of the OpinionDetail
 */
export const useImages = refImages => useTracker( () => {
    const noDataAvailable = [ [] /*images*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const subscription = Meteor.subscribe('images', refImages);

    if (!subscription.ready()) {
        return noDataAvailable;
    }

    let images = [];
    if (Array.isArray(refImages)) {
        images = Images.find( { _id: { $in: refImages } } ).fetch();    
    } else if ((typeof refImages === 'string' || refImages instanceof String)) {
        images = Images.find( { _id: refImages } ).fetch(); 
    } else {
        images = Images.find().fetch();
    }
    return [
        images.map( file => {
            const imgs = Images.findOne({_id: file._id});
            let link = imgs && imgs.link();
            file.link = link;
            if ( file.meta
              && file.meta.annotStateImageId ) {
                  const imgs2 = Images.findOne({_id: file.meta.annotStateImageId});
                  let link2 = imgs2 && imgs2.link();
                  file.link2 = link2;
            }
            return file;
        }),
        false
    ];
});



/**
 * Load all opinionDetails with Type ANSWER and actionText for the given Opinion that should listed
 * in the actionlist orderd by actioncode
 * 
 * @param {String} refOpinion Specifies the opinion
 */
export const useOpinionActionList = refOpinion => useTracker( () => {
    const noDataAvailable = [ [] /*actionListitems*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    // Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
    //const subscription = Meteor.subscribe('opinionDetailsActionListitems', refOpinion);
    const subscription = Meteor.subscribe('opinionDetailsActionListitemsAsync', refOpinion);

    if (!subscription.ready()) {
        return noDataAvailable;
    }

    let actionListitems = OpinionDetails.find({
        refOpinion,
        type: 'QUESTION', //{ $in: [ 'QUESTION', 'ANSWER'] },
        deleted: false,
        finallyRemoved: false,
        actionCode: { $ne: 'okay' },
        actionText: { $ne: null }
    }, {
        fields: {
            _id: 1,
            refOpinion: 1,
            actionCode: 1,
            actionText: 1,
            parentPosition: 1,
            position: 1
        },
        sort: {
            actionPrio: 1,
            //orderString: 1,
            parentPosition: 1,
            position: 1
        }
    }).map(item => {
        item.key = item._id;
        return item;
    });

    
    return [ actionListitems, false ];
}, [refOpinion]);

/**
 * Load the given Pdf-meta-data for the given opinion.
 * 
 * @param {String} refOpinion   id of the Opinion
 */
export const useOpinionPdfs = ( refOpinion , archive = false ) => useTracker( () => {
    const noDataAvailable = [ [] /*opinionPdfs*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const handler = Meteor.subscribe('opinion-pdfs', refOpinion);

    if (!handler.ready()) { 
        return noDataAvailable;
    }

    const data = archive
                    ? OpinionPdfs.find({ "meta.refOpinion": refOpinion , "meta.archive": true }, { sort: { 'meta.createdAt': -1 }}).fetch()
                    : OpinionPdfs.find({
                        $and:[
                            { "meta.refOpinion": refOpinion } , 
                            { $or:[
                                { "meta.archive": null },
                                { "meta.archive": false }
                            ]}]},
                            { sort: { 'meta.createdAt': -1 }}).fetch();

    return [
        data.map( file => {
            const pdfs = OpinionPdfs.findOne({_id: file._id});
            let link = pdfs && pdfs.link();
            file.link = link;
            return file;
        }), 
        false
    ];
}, [refOpinion]);


/**
 * Load the current Avatar for the given user
 * 
 * @param {String} userId   Specifies the user
 */
export const useAvatar = userId => useTracker( () => {
    const noDataAvailable = [ null /*avatar*/ , true /*loading*/];

    if (!Meteor.user()) {
        return noDataAvailable;
    }
    const handler = Meteor.subscribe('avatar', userId);

    if (!handler.ready()) { 
        return noDataAvailable;
    }

    const avatar = Avatars.findOne({ userId });

    return [
        avatar ? avatar.link() : null,
        false
    ];
}, [userId]);
