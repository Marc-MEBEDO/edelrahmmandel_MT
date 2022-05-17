import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Sequences } from '../collections/sequences';

var SequencesRawCollection,
    SequencesFindAndModify;

if (Meteor.isServer) {
    // rawCollection only server-side supported!
    SequencesRawCollection = Sequences.rawCollection();
    //SequencesFindAndModify = Meteor.wrapAsync(SequencesRawCollection.findAndModify, SequencesRawCollection);
    SequencesFindOneAndUpdate = Meteor.wrapAsync(SequencesRawCollection.findOneAndUpdate, SequencesRawCollection);
}

/**
 * Generate a unique Auto-Value
 * 
 * @param {String} name Name of the Sequence
 * @param {*} startValue Value to start with if the sequence does not exists
 */
export const sequenceNextValue = (seqName, startValue = 1) => {
    check(seqName, String);

    // check if sequence exists
    const doc = Sequences.findOne({_id: seqName});
    if (!doc) {
        try {
            Sequences.insert({
                _id: seqName, 
                value: startValue
            });
    
            return startValue;
        } catch (err) {
            // check if err was that the sequence already exists
            // so another user had generated the sequence a few microsecs before
            // TODO: check error number or name
            if (err.name === '') {
                return sequenceNextValue(seqName);
            }
        }
    }

    const result = SequencesFindOneAndUpdate({ _id: seqName }, { $inc: { value: 1 } } );
    return result.value.value;
}