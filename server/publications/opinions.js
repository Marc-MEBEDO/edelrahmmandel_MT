import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Opinions } from '../../imports/api/collections/opinions';
import { OpinionPdfs } from '../../imports/api/collections/opinion-pdfs';

Meteor.publish('opinions', function publishOpinions(id) {
    if ( !id )
        return Opinions.find({
            "sharedWith.user.userId": this.userId
        });

    check (id, String);
    
    return Opinions.find({
        _id: id,
        "sharedWith.user.userId": this.userId
    });
});

Meteor.publish('allOpinionsForControl', function publishOpinions(id) {
    // Liefert alle Gutachten für Spezialrolle für Gutachten Kontrolle.
    if ( !this.userId ) {
        throw new Meteor.Error('Not authorized.');
    }
    const currentUser = Meteor.users.findOne( this.userId );
    if ( !id )
        if ( currentUser.userData.roles.includes( 'OPINION_CONTROL' ) )
            return Opinions.find();
        else
            return Opinions.find({
                "sharedWith.user.userId": this.userId
            });

    check (id, String);
    
    if ( currentUser.userData.roles.includes( 'OPINION_CONTROL' ) )
        return Opinions.find({
            _id: id
        });
    else
        return Opinions.find({
            _id: id,
            "sharedWith.user.userId": this.userId
        });
});


Meteor.publish('opinion-pdfs', function publishOpinionPdfs(refOpinion) {
    check (refOpinion, String);
    
    return OpinionPdfs.find({
        "meta.refOpinion": refOpinion
    }).cursor;
});