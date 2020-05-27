const Harvest = require("harvest").default;

exports.sourceNodes = async (
  { boundActionCreators: { createNode }, createNodeId, createContentDigest },
  { plugins, ...options }
) => {
  const harvest = new Harvest({
    subdomain: options.subdomain,
    userAgent: options.userAgent,
    concurrency: 1,
    auth: {
      accessToken: options.accessToken,
      accountId: options.accountId
    }
  });

  function getAllEntries(page, entries, limit, resolve, reject) {
    harvest.timeEntries
      .list({
        page: page,
        client_id: "5630712"
      })
      .then((response) => {
        const retrivedEntries = entries.concat(response.time_entries)
        if (response.next_page !== null && page < limit) {
          console.log(`Getting page ${page} from GetHarvest.com`)
          getAllEntries(response.next_page, retrivedEntries, limit, resolve, reject)
        } else {
          resolve(retrivedEntries)
        }
      })
      .catch(error => {
        console.log(error)
        reject('Something wrong. Please refresh the page and try again.')
      })
    }

    async function waitForEntries() {
      return new Promise((resolve, reject) => {
        getAllEntries(1, [], 5, resolve, reject)
      })
    }

    const response = await waitForEntries();

    response.forEach(entry => {
      createNode({
        ...entry,
        id: createNodeId(`harvest-${entry.id}`),
        parent: null,
        children: [],
        internal: {
          type: 'Harvest',
          content: JSON.stringify(entry),
          contentDigest: createContentDigest(entry)
        }
      });
    });

};
