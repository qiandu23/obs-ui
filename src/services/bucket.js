import {httpRequestWithAuth, getToken, getAccount} from '@/common'

class BucketService {
  listBucket(storageName) {
    return httpRequestWithAuth(getToken(), getAccount())
      .get(`/api/bucket/list-bucket?storageName=${encodeURI(storageName)}`)
  }

  listObject(storageName, name, prefix, marker, maxKeys) {
    return httpRequestWithAuth(getToken(), getAccount())
      .get('/api/bucket/list-object?'+
      `storageName=${encodeURI(storageName)}&name=${encodeURI(name)}&prefix=${encodeURI(prefix)}`+
      `&marker=${encodeURI(marker)}&maxKeys=${maxKeys}`)
  }

  createBucket(name, storageName) {
    return httpRequestWithAuth(getToken(), getAccount()).post('/api/bucket/create-bucket', {
      name, storageName
    })
  }

  deleteBucket(name, storageName) {
    return httpRequestWithAuth(getToken(), getAccount())({
      method: 'delete',
      url: '/api/bucket/delete-bucket',
      data: {name, storageName}
    })
  }
}

export default BucketService
