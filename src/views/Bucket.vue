<template>
  <div>
    <UIHeader>
    </UIHeader>
    <el-row>
      <el-col :offset="1" :span="22">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>Bucket</span>
            <div style="float: right;">
              <el-select v-model="selectedStorageName" placeholder="请选择" @change="changeSelectedStorage"
                         :style="isMobile?'margin-right:5px':'margin-right:5px;margin-top: -10px'">
                <el-option
                    v-for="item in storageNames"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                </el-option>
              </el-select>
              <el-button type="primary"
                         :style="isMobile?'':'margin-top: -5px'"
                         size="small" icon="el-icon-plus"
                         @click="openCreateDialog">New
              </el-button>
            </div>
          </div>
          <div>
            <el-table
                :data="tableData.filter(data => !search || data.name.toLowerCase().includes(search.toLowerCase()))"
                border
                style="width: 100%">
              <el-table-column
                  sortable
                  align="center"
                  prop="name"
                  label="Name">
              </el-table-column>
              <el-table-column label="Operation" align="center">
                <template slot-scope="scope">
                  <el-dropdown size="mini" @command="(command)=>handleOperationClick(command,scope.row)">
                    <el-button size="mini" type="primary">
                      Operation<i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="del" class="dropdown-item"><i class="el-icon-delete el-icon--left"></i>Delete
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

      </el-col>
    </el-row>

    <el-dialog :title="formTitle" :visible.sync="formVisible" :close-on-click-modal="false"
               :width="isMobile?'95%':'50%'">
      <el-form :model="form">
        <el-input v-model="form.id" type="hidden"></el-input>
        <el-form-item label="Storage" :label-width="formLabelWidth">
          <el-input v-model="selectedStorageName" maxlength="20" show-word-limit readonly="readonly"></el-input>
        </el-form-item>
        <el-form-item label="Name" :label-width="formLabelWidth">
          <el-input v-model="form.name" maxlength="20" show-word-limit :readonly="!isAdd"></el-input>
        </el-form-item>
        <el-alert
            @close="clearFormErrorMessage"
            v-show="!!formErrorMessage"
            :title="formErrorMessage"
            type="error">
        </el-alert>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="formVisible = false">Cancel</el-button>
        <el-button type="primary" @click="confirmCreateBucket">Confirm
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import UIHeader from '../components/ui-header'
import {getResponseError, getResponseJson, getResponseStatus} from '@/common'
import BucketService from '../services/bucket'
import async from 'async'
import viewportSize from "get-viewport-size";
import StorageService from "@/services/storage";

const storageService = new StorageService()
const bucketService = new BucketService()
export default {
  name: 'Bucket',
  data() {
    return {
      search: '',
      tableData: [],
      isAdd: false,
      formVisible: false,
      form: {
        id: '',
        name: '',
        storageName: ''
      },
      formLabelWidth: '100px',
      formErrorMessage: '',
      formTitle: '',
      adminSelect: {
        options: [],
        selectedValue: ''
      },
      viewWidth: viewportSize().width,
      isMobile: viewportSize().width < 768,
      storageNames: [{
        value: '',
        label: 'No Storage'
      }],
      selectedStorageName: ''
    }
  },
  components: {UIHeader,},
  methods: {
    changeSelectedStorage(){
      const self=this
      bucketService.listBucket(self.selectedStorageName).then(res => {
        self.tableData = getResponseJson(res)
      }).catch(err => {
        let errorStatus = getResponseStatus(err)
        let errorMessage = getResponseError(err)
        if (errorStatus === 401 && err) {
          self.$router.replace(`/sign-in`)
          return
        }

        self.$message.error(errorMessage)
      })
    },
    handleOperationClick(command, row) {
      if (command === 'edit') {
        this.openEditDialog(row)
      } else if (command === 'del') {
        this.deleteBucket(row)
      }
    },
    openCreateDialog() {
      this.formTitle = 'New Bucket'
      this.isAdd = true
      this.form.id = ''
      this.form.name = ''
      this.form.storageName = this.selectedStorageName
      this.clearFormErrorMessage()
      this.formVisible = true
    },
    confirmCreateBucket() {
      this.confirmCreateBucketUser()
    },
    confirmCreateBucketUser() {
      const self = this
      let errorStatus = 500
      const {name, storageName} = self.form
      async.waterfall([
        cb => {
          bucketService.createBucket(name, storageName).then(res => {
            const result = getResponseJson(res)
            self.$message.success(result.message)
            self.formVisible = false
            cb(null)
          }).catch(err => {
            errorStatus = getResponseStatus(err)
            cb(new Error(getResponseError(err)))
          })
        },
        cb => {
          bucketService.listBucket(storageName).then(res => {
            self.tableData = getResponseJson(res)
            cb(null)
          }).catch(err => {
            errorStatus = getResponseStatus(err)
            cb(new Error(getResponseError(err)))
          })
        }
      ], err => {
        if (errorStatus === 401 && err) {
          self.$router.replace(`/sign-in`)
          return
        }

        if (err) {
          self.formErrorMessage = err.message
        }
      })

    },
    clearFormErrorMessage() {
      this.formErrorMessage = ''
    },
    deleteBucket(row) {
      this.deleteBucketUser(row)
    },
    deleteBucketUser(row) {
      const self = this
      let errorStatus = 500
      let isCancel = false
      async.waterfall([
        cb => {
          self.$confirm('This operation will permanently delete the bucket. Continue?', 'Tip', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'warning',
            center: true,
            customClass: self.isMobile ? 'mobile-confirm-box' : 'confirm-box'
          }).then((action) => {
            console.info(action)
            cb(null)
          }).catch(() => {
            isCancel = true
            self.$message({
              type: 'info',
              message: 'Delete Be Canceled'
            })
            cb(null)
          })
        },
        cb => {
          if (isCancel) return cb(null)
          bucketService.deleteBucket(row.name, self.selectedStorageName).then(res => {
            const result = getResponseJson(res)
            self.$message.success(result.message)
            cb(null)
          }).catch(err => {
            errorStatus = getResponseStatus(err)
            cb(new Error(getResponseError(err)))
          })
        },
        cb => {
          if (isCancel) return cb(null)
          bucketService.listBucket(self.selectedStorageName).then(res => {
            self.tableData = getResponseJson(res)
            cb(null)
          }).catch(err => {
            errorStatus = getResponseStatus(err)
            cb(new Error(getResponseError(err)))
          })
        }
      ], err => {
        if (errorStatus === 401 && err) {
          self.$router.replace(`/sign-in`)
          return
        }

        if (err) {
          self.$message.error(err.message)
        }
      })
    },
    initBucket() {
      const self = this
      async.waterfall([
        cb => {
          storageService.listStorageNames().then(res => {
            const result = getResponseJson(res)
            if (result.length > 0) {
              self.storageNames = []
              for (let storage of result) {
                self.storageNames.push({
                  value: storage, label: storage
                })
              }

              self.selectedStorageName = self.storageNames[0].value
            }

            cb(null)
          }).catch(err => {
            cb(err)
          })
        },
        cb => {
          if (!self.selectedStorageName) {
            return cb(null)
          }

          bucketService.listBucket(self.selectedStorageName).then(res => {
            self.tableData = getResponseJson(res)
            cb(null)
          }).catch(err => {
            cb(err)
          })
        },
      ], err => {
        if (err) {
          let errorStatus = getResponseStatus(err)
          let errorMessage = getResponseError(err)
          if (errorStatus === 401 && err) {
            self.$router.replace(`/sign-in`)
            return
          }

          self.$message.error(errorMessage)
        }
      })
    }
  },
  mounted() {
    const self = this
    window.onresize = function () {
      self.viewWidth = viewportSize().width
      self.isMobile = self.viewWidth < 768
    }
    self.$store.commit('updateActiveIndex', '/bucket-class')
    self.$store.dispatch('getAdminRole', self.initBucket)
  }
}
</script>

<style>
.mobile-confirm-box {
  width: 95%;
}

.confirm-box {
  width: 50%;
}
</style>
