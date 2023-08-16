import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email'

import './fixtures';
import './publications';
import './methods'; 
import '../imports/api/methods';

import './datatransfer';

import './datamigration';

import { Accounts } from 'meteor/accounts-base'
import { UserActivities } from '../imports/api/collections/userActivities';

Accounts.validateLoginAttempt( loginData => {
    const { allowed, methodName } = loginData;
    if (methodName == 'verifyEmail' || methodName == 'resetPassword') {
        return allowed;
    }

    if (methodName == 'login') {
        if (loginData.methodArguments[0].resume && allowed) return true;

        const { user } = loginData.methodArguments[0];
        if (!user)
            return false;

        // check if we got a user like "admin" that signed in without email
        if (user.username && !user.email && allowed) {
            return true;
        }
        const verifiedUser = Meteor.users.findOne({
            'emails.address': user.email,
            'emails.verified': true
        });

        // Prüfung, ob Benutzer aktiv ist!
        if ( typeof verifiedUser.active == "undefined" ) {
            // 'active' Feld existiert nicht => aktiv
        }
        else if ( verifiedUser.active ) {
            // aktiv
        }
        else {
            // NICHT aktiv
            console.log( 'Dieser Benutzer ist nicht aktiv.' );
            return false;
        }

        return !!verifiedUser;
    }

    throw new Meteor.Error('Unknown Loginattempt rejected.');
});


const sendUnreadMessages = () => {
    // lesen aller Useractivities, die noch nicht gelesen wurden und noch nicht per E-Mail versandt sind */
    const messages = UserActivities.find({
        unread: true,
        $or: [
            { mailsent: { $exists: false } },
            { mailsent: false }
        ]
    }).fetch();

    if (messages) {
        messages.map( msg => {
            const targetUser = Meteor.users.findOne(msg.refUser, { fields: { 'emails': 1, 'userData': 1 } });            
            const { emails, userData } = targetUser
                        
            // der Admin-User hat keine Mailadresse sondern einen Benutzernamen
            const { address: targetEmailAddress } = ( emails && emails[0] && emails[0].verified && emails[0] ) || { address: userData.email };
            
            const { gender, firstName, lastName } = userData;
            const toAddress = targetEmailAddress || userData.email

            const { firstName: senderFirstName, lastName: senderLastName } = msg.createdBy;
            
            let subject;
            switch (msg.type) {
                case 'MENTIONED':
                    subject = `${senderFirstName} ${senderLastName} hat Sie erwähnt`;
                    break;
                case 'SHAREDWITH':
                    subject = `${senderFirstName} ${senderLastName} hat ein Gutachten mit Ihnen geteilt`;
                    break;
                case 'REPLYTO':
                    subject = `${senderFirstName} ${senderLastName} hat Ihnen geantwortet`;
                    break;

                default:
                    subject = 'Eine neue Nachricht für Sie'
            }

            try {
                Email.send({
                    to: toAddress,
                    /*from: {
                        name: `${senderFirstName} ${senderLastName} (GutachtenPlus)`,
                        address: 'gutachtenplus@mebedo-ac.de'
                    },*/
                    from: `"${senderFirstName} ${senderLastName} (GutachtenPlus)" <gutachtenplus@mebedo-ac.de>`,
                    subject,
                    html: `
                        Hallo ${firstName} ${lastName},
                        <p>
                            nachfolgende Nachricht haben Sie innerhalb der MEBEDO GutachtenPlus-App erhalten:
                        </p>
                        <p>
                            <strong>${msg.message}</strong>
                        </p>
                        <p>
                            ${msg.originalContent}
                        </p>
                        <p>
                            Bitte antworten Sie nicht auf diese E-Mail. Diese Nachricht wurde automatisch erstellt.
                        </p>
                    `
                });

                UserActivities.update( msg._id, { $set: { mailsent: true } });
            } catch( mailErr ) {
                console.log('Error', mailErr.message);
            }
        });
    }
}

Meteor.startup(() => {

    Meteor.setInterval( sendUnreadMessages, 1000 * 60 * 30 /* alle 30 Minuten */);
    sendUnreadMessages();

    console.log('Running in ' + process.env.NODE_ENV + ' mode.');
});
