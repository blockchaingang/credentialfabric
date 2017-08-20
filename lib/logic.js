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
 * @param {org.blockchaingang.credentialfabric.RequestCredentialIssue} request - the request new credential Transaction
 * @transaction
 */
function requestCredentialIssue(request) {

    return getAssetRegistry( 'org.blockchaingang.credentialfabric.IssueRequest')
        .then( function(registry){
            var factory = getFactory();
            var issueReq = factory.newResource( 'org.blockchaingang.credentialfabric', 'IssueRequest', request.$identifier );
            issueReq.fulfilled = false;
            issueReq.requester = request.requester;
            issueReq.authority = request.authority;

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
    return getAssetRegistry( 'org.blockchaingang.credentialfabric.UpdateRequest')
        .then( function(registry){
            var factory = getFactory();
            var updateReq = factory.newResource( 'org.blockchaingang.credentialfabric', 'UpdateRequest', request.$identifier );
            updateReq.fulfilled = false;
            updateReq.requester = request.requester;
            updateReq.authority = request.authority;
            updateReq.currentEntry = request.currentEntry;

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

    return getAssetRegistry( 'org.blockchaingang.credentialfabric.IssueRequest')
        .then( function(registry) {
            return registry.get(issue.requestId)
                .then( function(request) {
                    return request;
                })
                .catch( function(err) {
                    throw new Error( 'Invalid Request Id');
                });
        })
        .then( function (request) {
                if( !request.fulfilled )  {
                    if( (request.requester.getIdentifier() === issue.recepient.getIdentifier()) 
                            && (request.authority.getIdentifier() === issue.authority.getIdentifier() ) ) {
                        var factory = getFactory();
                        var entry = factory.newResource( 'org.blockchaingang.credentialfabric', 
                                                            'CredentialEntry',
                                                            issue.$identifier
                                                          );
                        entry.description = issue.description;
                        entry.type = issue.type;
                        entry.startDate = (issue.startDate == null )?(null):(new Date(issue.startDate));
                        entry.endDate = (issue.endDate == null )?(null):(new Date(issue.endDate));
                        entry.expiryDate = (issue.expiryDate == null )?(null):(new Date(issue.expiryDate));
                        entry.owner = issue.recepient;
                        entry.issuingAuthority = issue.authority;
                        entry.latitude = issue.latitude;
                        entry.longitude = issue.longitude;

                        var detail = factory.newResource( 'org.blockchaingang.credentialfabric', 
                                                            'CredentialEntryDetail',
                                                            issue.$identifier
                                                          );
                        detail.score = issue.score;
                        entry.detail = detail;
                        detail.entry = entry;

                        return getAssetRegistry('org.blockchaingang.credentialfabric.CredentialEntry')
                            .then( function(credentialRegistry) {
                                return credentialRegistry.add( entry, { convertResourcesToRelationships: true } );
                            })
                            .then( function() {
                                return getAssetRegistry('org.blockchaingang.credentialfabric.CredentialEntryDetail')
                            })
                            .then( function(credentialRegistry) {
                                    return credentialRegistry.add( detail);
                            })
                            .then ( function() {
                                return getAssetRegistry('org.blockchaingang.credentialfabric.IssueRequest')
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

    return getAssetRegistry( 'org.blockchaingang.credentialfabric.UpdateRequest')
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
                if( !request.fulfilled )  {
                    if( (request.requester.getIdentifier() === update.recepient.getIdentifier()) 
                            && (request.authority.getIdentifier() === update.authority.getIdentifier() ) ) {
                        return getAssetRegistry('org.blockchaingang.credentialfabric.CredentialEntry')
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
                                entry.latitude = update.latitude;
                                entry.longitude = update.longitude;

                                return credentialRegistry.update( entry );
                            })
                            .then( function() {
                                return getAssetRegistry('org.blockchaingang.credentialfabric.CredentialEntryDetail')
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
                                return getAssetRegistry('org.blockchaingang.credentialfabric.UpdateRequest')
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
