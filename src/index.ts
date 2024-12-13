import * as core from '@actions/core';
import {getInputs, logOutputs, setOutput, OperationType} from './io';
import {Octo} from './api';
import {debug, stringifyCSVArray} from './utils';
import {FieldDataType} from './api/generated';

const supportedDataTypes = [
  'TEXT',
  'SINGLE_SELECT',
  'NUMBER',
  'DATE',
  'ITERATION',
] as FieldDataType[];

(async () => {
  core.startGroup('Checking inputs...');
  const inputs = await getInputs();
  core.info('Inputs are valid.');
  debug(inputs);
  core.endGroup();

  core.startGroup('Initializing Octokit...');
  const octokit = new Octo(inputs.github_token);
  core.info('Octokit is initialized.');
  core.endGroup();

  core.startGroup('Getting project ID...');
  const projectId = await octokit.getProjectId(
    inputs.project.owner,
    inputs.project.number
  );
  core.info('Project ID fetched correctly.');
  debug(projectId);
  core.endGroup();

  switch (inputs.operation) {
    case OperationType.GET_FIELDS: {
      core.startGroup('Getting current card field values...');
      const fieldRecords = await octokit.getFieldValues(
        inputs.resource.url,
        projectId
      );
      core.info('Card field values fetched correctly.');
      debug(fieldRecords);
      core.endGroup();
      core.startGroup('Setting outputs...');
      const results = inputs.fields.map(field => {
        if (fieldRecords[field]?.unsupported)
          throw new Error(
            `Field "${field}" has an unsupported data type: ${fieldRecords[field].type}`
          );
        return fieldRecords[field];
      });
      const csv = stringifyCSVArray(results.map(r => r?.value));
      core.info('CSV output generated correctly.');
      debug(csv);

      setOutput('values', csv);
      core.info('Output set correctly.');
      core.endGroup();

      break;
    }
    case OperationType.SET_FIELDS:
    case OperationType.CLEAR_FIELDS: {
      if (inputs.operation === OperationType.SET_FIELDS) {
        core.startGroup('Setting field values...');
      } else {
        core.startGroup('Clearing field values...');
      }

      const itemId = await octokit.getItemId(inputs.resource.url, projectId);
      core.info('Item ID fetched correctly.');
      debug(itemId);

      const fields = await Promise.all(
        inputs.fields.map(async fieldName => {
          const field = await octokit.getField(
            inputs.project.owner,
            inputs.project.number,
            fieldName
          );
          core.info(`Field ${fieldName} fetched correctly.`);
          debug(field);
          return {
            name: fieldName,
            ...field,
          };
        })
      );
      core.info('All fields fetched correctly.');
      debug(fields);

      const invalidFields = fields.filter(
        f => !supportedDataTypes.includes(f.dataType)
      );
      if (invalidFields.length > 0)
        throw new Error(
          `The following fields are not supported: ${invalidFields
            .map(f => `${f.name} (${f.dataType})`)
            .join(', ')}`
        );

      if (inputs.operation === OperationType.SET_FIELDS) {
        if (inputs.values) {
          await Promise.all(
            inputs.values.map(async (value, i) => {
              const field = fields[i];
              if (!field)
                throw new Error(
                  'Fields/values length mismatch. This should never happen.'
                );
              if (value === '') {
                await octokit.clearFieldValue(projectId, itemId, field.id);
                core.info(`Field ${field.name} cleared correctly.`);
              } else {
                if (field.dataType === 'NUMBER' && Number.isNaN(Number(value)))
                  throw new Error(
                    `Field ${field.name} has data type ${field.dataType}, but the value is not a number.`
                  );
                let singleSelectOptionId: string;
                if (field.dataType === 'SINGLE_SELECT') {
                  const option = field.options.find(o => o.name === value);
                  if (!option)
                    throw new Error(
                      `Field ${field.name} has data type ${field.dataType}, but the value is not a valid option.`
                    );
                  singleSelectOptionId = option.id;
                }
                let iterationId: string;
                if (field.dataType === 'ITERATION') {
                  const allIterations = field.configuration.iterations.concat(
                    field.configuration.completedIterations
                  );
                  const iteration = allIterations.find(o => o.title === value);
                  if (!iteration)
                    throw new Error(
                      `Field ${field.name} has data type ${field.dataType}, but the value is not a valid iteration.`
                    );
                  iterationId = iteration.id;
                }
                const newValue:
                  | Parameters<(typeof octokit)['setFieldValue']>[3]
                  | undefined =
                  field.dataType === 'TEXT'
                    ? {
                        text: value,
                      }
                    : field.dataType === 'SINGLE_SELECT'
                      ? {
                          singleSelectOptionId: singleSelectOptionId!,
                        }
                      : field.dataType === 'NUMBER'
                        ? {
                            number: Number(value),
                          }
                        : field.dataType === 'DATE'
                          ? {
                              date: value,
                            }
                          : field.dataType === 'ITERATION'
                            ? {
                                iterationId: iterationId!,
                              }
                            : undefined;
                if (!newValue)
                  throw new Error(
                    `Field ${field.name} has an unsupported data type: ${field.dataType}. This should never happen.`
                  );

                await octokit.setFieldValue(
                  projectId,
                  itemId,
                  field.id,
                  newValue
                );
                core.info(`Field ${field.name} set correctly.`);
              }
            })
          );
          core.info('All fields have been updated correctly.');

          core.endGroup();

          core.startGroup('Setting outputs...');
          const csv = stringifyCSVArray(inputs.values);
          core.info('CSV output generated correctly.');
          debug(csv);
          setOutput('values', csv);
          core.info('Output set correctly.');
          core.endGroup();
        }
      } else {
        await Promise.all(
          fields.map(async field => {
            await octokit.clearFieldValue(projectId, itemId, field.id);
            core.info(`Field ${field.name} cleared correctly.`);
          })
        );

        core.endGroup();
      }

      break;
    }
  }
})()
  .catch(e => {
    core.setFailed(e);
    core.endGroup();
  })
  .finally(() => {
    logOutputs();
  });
