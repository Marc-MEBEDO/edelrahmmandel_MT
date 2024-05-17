import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Opinions } from '/imports/api/collections/opinions';
import { Activities } from '/imports/api/collections/activities';

Meteor.publish('activities', function publishActivities({ refOpinion, refDetail }) {
    check(refOpinion, String);
    if (refDetail) check(refDetail, String);

    // check if opinion is shared with the current user
    let permitted = Opinions.findOne({
        _id: refOpinion,
        "sharedWith.user.userId": this.userId
    });

    if (!permitted) return null;
    
    // elemenating undefned
    refDetail = refDetail || null;
    if (refDetail)
        return Activities.find({ refDetail });
    if (refOpinion)
        return Activities.find({ refOpinion, refDetail });
});

// Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
Meteor.publish('activitiesAsync', async function publishActivitiesAsync({ refOpinion , refDetail , hasRoleOPINION_CONTROL = false }) {
    check(refOpinion, String);
    if (refDetail) check(refDetail, String);

    // check if opinion is shared with the current user
    let permitted;
    if ( hasRoleOPINION_CONTROL )
        // Spezialrolle für Gutachten Kontrolle beachten.
        permitted = await Opinions.findOneAsync({
            _id: refOpinion
        });
    else
        permitted = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

    if (!permitted) return null;
    
    // elemenating undefned
    refDetail = refDetail || null;
    if (refDetail)
        return Activities.find({ refDetail });
    if (refOpinion)
        return Activities.find({ refOpinion, refDetail });
});