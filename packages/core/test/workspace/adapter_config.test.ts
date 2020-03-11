/*
*                      Copyright 2020 Salto Labs Ltd.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with
* the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import { ElemID, ObjectType, Field, BuiltinTypes, InstanceElement } from '@salto-io/adapter-api'
import { DirectoryStore } from '../../src/workspace/dir_store'
import { dumpElements } from '../../src/parser/dump'
import { configSource } from '../../src/workspace/config_source'

jest.mock('../../../src/workspace/local/dir_store')
describe('configs', () => {
  const adapter = 'mockadapter'
  const configID = new ElemID(adapter)
  const configType = new ObjectType({
    elemID: configID,
    fields: {
      field1: new Field(configID, 'field1', BuiltinTypes.STRING, {}, true),
      field2: new Field(configID, 'field2', BuiltinTypes.STRING),
    },
  })
  const config = new InstanceElement(ElemID.CONFIG_NAME, configType, {
    field1: ['test1', 'test2'],
    field2: 'test3',
  })

  const dumpedConfig = { filename: `${adapter}.bp`, buffer: dumpElements([config]) }
  const mockSet = jest.fn()
  const mockGet = jest.fn()
  const mockFlush = jest.fn()
  const mockedDirStore = {
    get: mockGet,
    set: mockSet,
    flush: mockFlush,
  } as unknown as DirectoryStore

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should set new adapter config', async () => {
    mockSet.mockResolvedValueOnce(true)
    mockFlush.mockResolvedValue(true)
    await configSource(mockedDirStore).set(adapter, config)
    expect(mockSet).toHaveBeenCalledWith(dumpedConfig)
    expect(mockFlush).toHaveBeenCalledTimes(1)
  })

  it('should get adapter config if exists', async () => {
    mockGet.mockResolvedValueOnce(dumpedConfig)
    const fromConfigStore = await configSource(mockedDirStore).get(adapter)
    expect(fromConfigStore?.value).toEqual(config.value)
  })

  it('should not fail if adapter config not exists', async () => {
    mockGet.mockResolvedValueOnce(undefined)
    const fromConfigStore = await configSource(mockedDirStore).get(adapter)
    expect(fromConfigStore).toBeUndefined()
  })
})