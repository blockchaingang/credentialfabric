/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 'use strict';

/**
 * Request a Credential Entry be added
 * @param {org.blockchaingang.credentialfabric.RequestNewCredential} request - the request new credential Transaction
 * @transaction
 */
function requestNewCredential(request) {

    return getAssetRegistry( 'org.blockchaingang.credentialfabric.NewCredentialRequest')
        .then( function(registry){
            var factory = getFactory();
            var issueReq = factory.newResource( 'org.blockchaingang.credentialfabric', 'NewCredentialRequest', request.$identifier );
            var expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            issueReq.fulfilled = false;
            issueReq.requester = getCurrentParticipant();
            issueReq.authority = request.authority;
            issueReq.expiryDate = expiryDate;

            return registry.add( issueReq );
        });
}

/**
 * Request a Credential Entry be updated
 * @param {org.blockchaingang.credentialfabric.RequestCredentialUpdate} request - the update exsiting credential transaction
 * @transaction
 */
function requestCredentialUpdate(request) {

    if( request.currentEntry.issuingAuthority.getIdentifier() != request.authority.getIdentifier() ) {
        throw new Error( 'Entry can only be updated by original Authority.');
    } else {
    return getAssetRegistry( 'org.blockchaingang.credentialfabric.UpdateCredentialRequest')
        .then( function(registry){
            var factory = getFactory();
            var updateReq = factory.newResource( 'org.blockchaingang.credentialfabric', 'UpdateCredentialRequest', request.$identifier );
            var expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            updateReq.fulfilled = false;
            updateReq.requester = getCurrentParticipant();
            updateReq.authority = request.authority;
            updateReq.currentEntry = request.currentEntry;
            updateReq.expiryDate = expiryDdate;

            return registry.add( updateReq );
        });
    }

}

/**
 * Create a Credential Entry
 * @param {org.blockchaingang.credentialfabric.IssueCredential} issue - the closeBidding transaction
 * @transaction
 */
function issueCredential(issue) {

    return getAssetRegistry( 'org.blockchaingang.credentialfabric.NewCredentialRequest')
        .then( function(registry) {
            return registry.get(issue.requestId)
                .then( function(request) {
                    return request;
                })
                .catch( function(err) {
                    throw err;
                    //throw new Error( 'Invalid Request Id');
                });
        })
        .then( function (request) {
                if( !request.fulfilled )  {
                    if( (request.requester.getIdentifier() === issue.recepient.getIdentifier()) 
                           && (getCurrentParticipant().getIdentifier() == request.authority.getIdentifier() ) ) {
                        var factory = getFactory();
                        var entry = factory.newResource( 'org.blockchaingang.credentialfabric', 
                                                            'Credential',
                                                            issue.$identifier
                                                          );
                        entry.description = issue.description;
                        entry.type = issue.type;
                        entry.startDate = (issue.startDate == null )?(null):(new Date(issue.startDate));
                        entry.endDate = (issue.endDate == null )?(null):(new Date(issue.endDate));
                        entry.expiryDate = (issue.expiryDate == null )?(null):(new Date(issue.expiryDate));
                        entry.owner = issue.recepient;
                        entry.issuingAuthority = getCurrentParticipant();

                        var detail = factory.newResource( 'org.blockchaingang.credentialfabric', 
                                                            'CredentialDetail',
                                                            issue.$identifier
                                                          );
                        detail.score = issue.score;
                        entry.detail = detail;
                        detail.entry = entry;

                        return getAssetRegistry('org.blockchaingang.credentialfabric.Credential')
                            .then( function(credentialRegistry) {
                                return credentialRegistry.add( entry, { convertResourcesToRelationships: true } );
                            })
                            .then( function() {
                                return getAssetRegistry('org.blockchaingang.credentialfabric.CredentialDetail')
                            })
                            .then( function(credentialRegistry) {
                                    return credentialRegistry.add( detail);
                            })
                            .then ( function() {
                                return getAssetRegistry('org.blockchaingang.credentialfabric.NewCredentialRequest')
                                        .then( function(requestRegistry) {
                                            request.fulfilled = true;
                                            return requestRegistry.update( request );
                                        });
                            });
                    } else {
                        throw new Error('Unauthorized');
                    }
                } else {
                    throw new Error( 'Request already fulfilled' );
                }
        })
        .catch( function(error)  {
            throw error;
        });
}

/**
 * Update a Credential Entry
 * @param {org.blockchaingang.credentialfabric.UpdateCredential} update - the closeBidding transaction
 * @transaction
 */
function updateCredential(update) {

    var credentialRegistry;
    var credential;
    var detailRegistry;

    return getAssetRegistry( 'org.blockchaingang.credentialfabric.UpdateCredentialRequest')
    .then( function(registry) {
        return registry.get(update.requestId)
            .then( function(request) {
                return request;
            })
            .catch( function(err) {
                throw new Error( 'Invalid Request Id');
            });
    })
    .then( function (request) {
                if( !request.fulfilled && (request.expiryDate <= Date.now() ) )   {
                    if( (request.requester.getIdentifier() === update.recepient.getIdentifier()) 
                            && (getCurrentParticipant().getIdentifier() === request.authority.getIdentifier() ) 
                            && (getCurrentParticipant().getIdentifier() === request.existingEntry.authority().getIdentifier() )) {
                        return getAssetRegistry('org.blockchaingang.credentialfabric.Credential')
                            .then(function(registry) {
                                credentialRegistry = registry;
                                return registry.get(update.existingEntry.$identifier)
                                    .then( function(entry) {
                                        return entry;
                                    })
                                    .catch( function(err) {
                                        throw new Exception('Invalid Entry');
                                    });
                            })
                            .then( function(entry) {
                                credential = entry;
                                entry.description = update.description;
                                entry.type = update.type;
                                entry.startDate = (update.startDate == null )?(null):(new Date(update.startDate));
                                entry.endDate = (update.endDate == null )?(null):(new Date(update.endDate));
                                entry.expiryDate = (update.expiryDate == null )?(null):(new Date(update.expiryDate));

                                return credentialRegistry.update( entry );
                            })
                            .then( function() {
                                return getAssetRegistry('org.blockchaingang.credentialfabric.CredentialEntry')
                            })
                            .then( function(registry) {
                                detailRegistry = registry;
                                return detailRegistry.get(credential.detail.$identifier);
                            })
                            .then( function(detail) {
                                detail.score = update.score;
                                return detailRegistry.update( detail );
                            })
                            .then ( function() {
                                return getAssetRegistry('org.blockchaingang.credentialfabric.UpdateCredentialRequest')
                                        .then( function(requestRegistry) {
                                            request.fulfilled = true;
                                            return requestRegistry.update( request );
                                        });
                            });

                    } else {
                        throw new Error('Unauthorized');
                    }
                } else {
                    throw new Error( 'Request already fulfilled' );
                }
        })
        .catch( function(error) {
            throw error;
        });
}
