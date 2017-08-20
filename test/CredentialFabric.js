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

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const path = require('path');
const uuid = require('uuid');

require('chai').should();

const bfs_fs = BrowserFS.BFSRequire('fs');
const NS = 'org.blockchaingang.credentialfabric';

describe('CredentialFabric', () => {

    // let adminConnection;
    let businessNetworkConnection;

    beforeEach(() => {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type: 'embedded'
        })
            .then(() => {
                return adminConnection.connect('defaultProfile', 'admin', 'Xurw3yU9zI0l');
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
            })
            .then((businessNetworkDefinition) => {
                return adminConnection.deploy(businessNetworkDefinition);
            })
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                return businessNetworkConnection.connect('defaultProfile', 'credential-fabric-network', 'admin', 'Xurw3yU9zI0l');
            });
    });

    describe('#requestCredentialIssue', () => {

        it('should add a Issue Request for this member and an authority', () => {

            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the member
            const member = factory.newResource(NS, 'Member', 'tuttle@brazil.org');
            member.firstName = 'Harry';
            member.lastName = 'Tuttle';

            // create Authority
            const authority = factory.newResource(NS, 'Authority', 'registrar@hardknocks.edu');
            authority.firstName = 'Reggie';
            authority.lastName = 'Registrar';

            const request = factory.newTransaction(NS, 'RequestCredentialIssue');
            request.requester = factory.newRelationship(NS, 'Member', member.$identifier);
            request.authority = factory.newRelationship(NS, 'Authority', authority.$identifier );

            return businessNetworkConnection.submitTransaction(request)
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.IssueRequest');
                        })
                        .then((registry) => {
                            return registry.get(request.$identifier);
                        })
                        .then((issueReq) => {
                            issueReq.requester.$identifier.should.equal(member.$identifier);
                            issueReq.authority.$identifier.should.equal(authority.$identifier);
                            issueReq.$identifier.should.equal(request.$identifier);
                        });
        });
    });

    describe('#issueCredential', () => {

        it('should issue a credential based on the request', () => {

            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Member
            const member = factory.newResource(NS, 'Member', 'tuttle@brazil.org');
            member.firstName = 'Harry';
            member.lastName = 'Tuttle';

            // create Authority
            const authority = factory.newResource(NS, 'Authority', 'registrar@hardknocks.edu');
            authority.firstName = 'Reggie';
            authority.lastName = 'Registrar';

            // create Isssue Request
            const issueRequest = factory.newResource(NS, 'IssueRequest', uuid.v4() );
            issueRequest.active = true;
            issueRequest.requester = factory.newRelationship(NS, 'Member', member.$identifier);
            issueRequest.authority = factory.newRelationship(NS, 'Authority', authority.$identifier);

            // create Issue Transaction
            const issuance = factory.newTransaction(NS, 'IssueCredential');
            issuance.requestId = issueRequest.$identifier;
            issuance.type = 'BACHELOR';
            issuance.description = 'Reality';
            issuance.startDate = new Date('1989-08-01');
            issuance.endDate = new Date('1993-05-31');
            issuance.expiryDate = null;
            issuance.score = '3.0/4.0';
            issuance.recepient = factory.newRelationship(NS, 'Member', member.$identifier);
            issuance.authority = factory.newRelationship(NS, 'Authority', authority.$identifier );

            return businessNetworkConnection.getAssetRegistry(NS + '.IssueRequest')
                    .then( (registry) => {
                        return registry.add(issueRequest);
                    })
                    .then( () => {
                        return businessNetworkConnection.submitTransaction(issuance);
                    })
                    .then(() => {
                        return businessNetworkConnection.getAssetRegistry(NS + '.CredentialEntry');
                    })
                    .then((registry) => {
                        return registry.get(issuance.$identifier);
                    })
                    .then((cred) => {
                        cred.type.should.equal(issuance.type);
                        cred.description.should.equal(issuance.description);
                        cred.startDate.toISOString().should.equal(issuance.startDate.toISOString());
                        cred.endDate.toISOString().should.equal(issuance.endDate.toISOString());
                        if( cred.expiryDate !== null && issuance.expiryDate !== null ) {
                            cred.expiryDate.should.toISOString().equal(issuance.expiryDate.toISOString());
                        }
                        cred.owner.$identifier.should.equal(issuance.recepient.$identifier);
                        cred.issuingAuthority.$identifier.should.equal(issuance.authority.$identifier);
                        cred.$identifier.should.equal(issuance.$identifier);
                    })
                    .then( function(){
                        return businessNetworkConnection.getAssetRegistry(NS + '.CredentialEntryDetail');
                    })
                    .then( function(registry) {
                        return registry.get(issuance.$identifier);
                    })
                    .then( function(detail) {
                        detail.score.should.equal(issuance.score);
                    });
        });
    });

    describe('#requestCredentialUpdate', () => {

        it('should add an Update Request for this member, authority and update credential', () => {

            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Member
            const member = factory.newResource(NS, 'Member', 'tuttle@brazil.org');
            member.firstName = 'Harry';
            member.lastName = 'Tuttle';

            // create Authority
            const authority = factory.newResource(NS, 'Authority', 'registrar@hardknocks.edu');
            authority.firstName = 'Reggie';
            authority.lastName = 'Registrar';

            // create an existing Credential
            const credential = factory.newResource(NS, 'CredentialEntry', uuid.v4(), { generate: 'sample' } );
            credential.owner = factory.newRelationship(NS, 'Member', member.$identifier);
            credential.issuingAuthority = factory.newRelationship(NS, 'Authority', authority.$identifier);

            const request = factory.newTransaction(NS, 'RequestCredentialUpdate');
            request.requester = factory.newRelationship(NS, 'Member', member.$identifier);
            request.authority = factory.newRelationship(NS, 'Authority', authority.$identifier );
            request.currentEntry = factory.newRelationship(NS, 'CredentialEntry', credential.$identifier );

            return businessNetworkConnection.getAssetRegistry(NS + '.CredentialEntry')
                    .then( (registry) => {
                        return registry.add(credential);
                    })
                    .then( () => {
                        return businessNetworkConnection.submitTransaction(request);
                    })
                    .then(() => {
                        return businessNetworkConnection.getAssetRegistry(NS + '.UpdateRequest');
                    })
                    .then((registry) => {
                        return registry.get(request.$identifier);
                    })
                    .then((updateReq) => {
                        updateReq.requester.$identifier.should.equal(member.$identifier);
                        updateReq.authority.$identifier.should.equal(authority.$identifier);
                        updateReq.currentEntry.$identifier.should.equal(credential.$identifier);
                        updateReq.$identifier.should.equal(request.$identifier);
                    });
        });
    });


    describe('#updateCredential', () => {

        it('should issue a credential based on the request', () => {

            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the Member
            const member = factory.newResource(NS, 'Member', 'tuttle@brazil.org');
            member.firstName = 'Harry';
            member.lastName = 'Tuttle';

            // create Authority
            const authority = factory.newResource(NS, 'Authority', 'registrar@hardknocks.edu');
            authority.firstName = 'Reggie';
            authority.lastName = 'Registrar';

            // create an existing Credential
            const detail = factory.newResource(NS, 'CredentialEntryDetail', uuid.v4(), { generate: 'sample' } );
            const credential = factory.newResource(NS, 'CredentialEntry', uuid.v4(), { generate: 'sample' } );
            credential.owner = factory.newRelationship(NS, 'Member', member.$identifier);
            credential.issuingAuthority = factory.newRelationship(NS, 'Authority', authority.$identifier);
            credential.detail = factory.newRelationship(NS, 'CredentialEntryDetail', detail.$identifier);
            detail.entry = factory.newRelationship(NS, 'CredentialEntry', credential.$identifier);

            // create Issue Request
            const updateRequest = factory.newResource(NS, 'UpdateRequest', uuid.v4() );
            updateRequest.active = true;
            updateRequest.requester = factory.newRelationship(NS, 'Member', member.$identifier);
            updateRequest.authority = factory.newRelationship(NS, 'Authority', authority.$identifier);
            updateRequest.currentEntry = factory.newRelationship(NS, 'CredentialEntry', credential.$identifier);

            // create Update Transaction
            const currance = factory.newTransaction(NS, 'UpdateCredential');
            currance.requestId = updateRequest.$identifier;
            currance.type = 'BACHELOR';
            currance.description = 'Reality';
            currance.startDate = new Date('1989-08-01');
            currance.endDate = new Date('1993-05-31');
            currance.expiryDate = null;
            currance.score = '3.0/4.0';
            currance.recepient = factory.newRelationship(NS, 'Member', member.$identifier);
            currance.authority = factory.newRelationship(NS, 'Authority', authority.$identifier );
            currance.existingEntry = factory.newRelationship(NS, 'CredentialEntry', credential.$identifier);

            return businessNetworkConnection.getAssetRegistry(NS + '.CredentialEntry')
                    .then( (registry) => {
                        return registry.add(credential);
                    })
                    .then( () => {
                        return businessNetworkConnection.getAssetRegistry(NS + '.CredentialEntryDetail');
                    })
                    .then( (registry) => {
                        return registry.add(detail);
                    })
                    .then( () => {
                        return businessNetworkConnection.getAssetRegistry(NS + '.UpdateRequest');
                    })
                    .then( (registry) => {
                        return registry.add(updateRequest);
                    })
                    .then( () => {
                        return businessNetworkConnection.submitTransaction(currance);
                    })
                    .then(() => {
                        return businessNetworkConnection.getAssetRegistry(NS + '.CredentialEntry');
                    })
                    .then((registry) => {
                        return registry.get(credential.$identifier);
                    })
                    .then((cred) => {
                        cred.type.should.equal(currance.type);
                        cred.description.should.equal(currance.description);
                        cred.startDate.toISOString().should.equal(currance.startDate.toISOString());
                        cred.endDate.toISOString().should.equal(currance.endDate.toISOString());
                        if( cred.expiryDate !== null && currance.expiryDate !== null ) {
                            cred.expiryDate.should.toISOString().equal(currance.expiryDate.toISOString());
                        }
                        cred.owner.$identifier.should.equal(currance.recepient.$identifier);
                        cred.issuingAuthority.$identifier.should.equal(currance.authority.$identifier);
                    })
                    .then( function(){
                        return businessNetworkConnection.getAssetRegistry(NS + '.CredentialEntryDetail');
                    })
                    .then( function(registry) {
                        return registry.get(detail.$identifier);
                    })
                    .then( function(deet) {
                        deet.score.should.equal(currance.score);
                    });
        });
    });
});