# Why we do it:

Today professionals are evaluated based on education of traditional institutions (colleges,universities), certifications(professional organizations), licensure(government agencies), and non-traditional education services(Udemy,Coursers,bootcamps) in addition to their experience. Providing proof of these different credentials involves requesting transcripts, certifications, licenses, and other documentation each time it is needed, whether that is for a job or educational opportunity. At the same time, different organizations required different levels of information. For example, employers needs to know degrees conferred where as graduate schools and teaching organizations need full transcripts.

With Credential Fabric, there is a single chain, managed by individuals but securely updated by certification authorities that can be reviewed by people needing that information as authorized by the individual.

# What it does

The Credential Fabric provides a Member to request the addition of credentials obtained (and updates for those that must be maintained) from issuing organizations, who are the Authority. The Members of the Credential Fabric can see each others public credential information and provide general and detailed information to Reviewers of credentials, whether for all or a single entry.



# Credential Fabric Network

> This is an interactive, distributed, system for collecting all of your educational, industry and regulatory credentials in a combined ledger. Credential Authorities provided information on what credentials you have received, covering time span and expiration, where needed. Authorities are invited by the Member to add credentials and update for those that can expire. All Members can see general credential information. Members who wish to be considered to as candidates for employement, educational, training and other opportunities can invite Reviewers to view both basic and detailed credential information.

This business network defines:

**Participants:**
`Member` `Authority` `Reviewer`

**Assets:**
`CredentialEntry` `CredentialEntryDetail` `IssueRequest` `UpdateRequest`

**Transactions:**
`RequestCredentialIssue` `RequestCredentialUpdate` `IssueCredential` `UpdateCredential` `ReviewCredentials` `ReviewCredential`
