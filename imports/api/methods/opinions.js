import { Meteor } from 'meteor/meteor';

import { Opinions, OpinionsSchema } from '../collections/opinions';
import { Activities } from '../collections/activities';

import { hasPermission, injectUserData } from '../helpers/roles';

Meteor.methods({
    async 'opinion.insert'(opinionData) {
        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        
        let currentUser = Meteor.users.findOne(this.userId);

        if (!await hasPermission({ currentUser }, 'opinion.create')) {
            throw new Meteor.Error('Keine Berechtigung zum Erstellen eines neuen Gutachten.');
        }

        let opinion = await injectUserData({ currentUser }, {...opinionData});
            
        try {
            OpinionsSchema.validate(opinion);
        } catch (err) {
            throw new Meteor.Error(err.message);
        }
        
        let newOpinionId = Opinions.insert(opinion);
        
        let activity = await injectUserData({ currentUser }, {
            refOpinion: newOpinionId,
            type: 'SYSTEM-LOG',
            message: 'Gutachten wurde erstellt.'
        }, { created: true });

        Activities.insert(activity);
    }
});