import { useNoYoloParser, USER_SOURCE } from "../hooks/use-no-yolo-parser";
import {
  BuiltInAddressInfoFetcher,
  BuiltInAddressInfoFetchersType,
  GenericAddressListEntry,
  NETWORKS,
  TokenListEntry,
} from "no-yolo-signatures";
import { Collapse, Table, Form, Select, Input, Divider, Button } from "antd";

const genericColumns = [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Description",
    dataIndex: "description",
  },
  {
    title: "Chain ID",
    dataIndex: "chainId",
  },
  {
    title: "Address",
    dataIndex: "address",
    render: (val: string, record: GenericAddressListEntry) => {
      const network = NETWORKS[record.chainId];
      if (!network) {
        return val;
      }
      return <a href={`${network.explorerURL}/address/${val}`}>{val}</a>;
    },
  },
];

function AddressInfoFetcherPanel(
  addressInfoFetcher: BuiltInAddressInfoFetcher
) {
  let title = "";
  let body = null;

  switch (addressInfoFetcher.type) {
    case BuiltInAddressInfoFetchersType.GenericAddressList:
      title = "Generic Address list";
      if (addressInfoFetcher.source !== USER_SOURCE) {
        title += ` (Source: ${addressInfoFetcher.source})`;
      }

      body = (
        <Table
          dataSource={addressInfoFetcher.addressList.addresses}
          columns={genericColumns}
        />
      );
      break;
    case BuiltInAddressInfoFetchersType.TokenList:
      title = "TokenList";
      if (addressInfoFetcher.source !== USER_SOURCE) {
        title += ` (Source: ${addressInfoFetcher.source})`;
      }
      const tokenColumns = [
        {
          title: "Name",
          dataIndex: "name",
        },
        {
          title: "Symbol",
          dataIndex: "symbol",
        },
        {
          title: "Chain ID",
          dataIndex: "chainId",
        },
        {
          title: "Address",
          dataIndex: "address",
          render: (val: string, record: TokenListEntry) => {
            const network = NETWORKS[record.chainId];
            if (!network) {
              return val;
            }
            return <a href={`${network.explorerURL}/address/${val}`}>{val}</a>;
          },
        },
      ];
      body = (
        <Table
          dataSource={addressInfoFetcher.tokenList.tokens}
          columns={tokenColumns}
        />
      );
      break;
    case BuiltInAddressInfoFetchersType.Context:
      title = "Context";
      break;

    default:
      break;
  }

  return { title, body };
}

export default function ParserSettings() {
  const {
    builtInInfoFetchers,
    customAddresses,
    addCustomAddress,
    removeCustomAddress,
    customAddressInfoFetchers,
    addCustomList,
    removeCustomList,
  } = useNoYoloParser();
  const [customAddressForm] = Form.useForm();
  const [customListForm] = Form.useForm();
  const requiredRules = [{ required: true }];
  const onFinishCustomAddressForm = (values: any) => {
    addCustomAddress(values);
    customAddressForm.resetFields();
  };
  const onFinishCustomListForm = (values: any) => {
    addCustomList(values);
    customListForm.resetFields();
  };
  const onChainChange = (chainId: number) => {
    customAddressForm.setFieldsValue({ chainId });
  };
  const onListTypeChange = (type: string) => {
    customListForm.setFieldsValue({ type });
  };
  const customAddressesColumns = [
    ...genericColumns,
    {
      title: "Actions",
      render: (_0: any, _1: any, index: number) => {
        return (
          <Button onClick={() => removeCustomAddress(index)}>Remove</Button>
        );
      },
    },
  ];
  return (
    <div>
      <h2>Parser Settings</h2>
      <h3>Address Info Fetchers</h3>
      <Collapse>
        <Collapse.Panel header="Custom Addresses" key="custom">
          <Table
            dataSource={customAddresses}
            columns={customAddressesColumns}
          />
          <Divider />
          <h3>Add new entry</h3>
          <Form
            form={customAddressForm}
            layout="inline"
            onFinish={onFinishCustomAddressForm}
          >
            <Form.Item label="Name" name="name" rules={requiredRules}>
              <Input />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
              rules={requiredRules}
            >
              <Input />
            </Form.Item>
            <Form.Item name="chainId" label="Chain" rules={requiredRules}>
              <Select style={{ minWidth: "200px" }} onChange={onChainChange}>
                {Object.values(NETWORKS).map((network) => (
                  <Select.Option value={network.chainId}>
                    {network.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Address" name="address" rules={requiredRules}>
              <Input />
            </Form.Item>
            <Form.Item shouldUpdate>
              {() => (
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={
                    !customAddressForm.isFieldsTouched(true) ||
                    !!customAddressForm
                      .getFieldsError()
                      .filter(({ errors }) => errors.length).length
                  }
                >
                  Add
                </Button>
              )}
            </Form.Item>
          </Form>
        </Collapse.Panel>
        {}
        {Object.keys(customAddressInfoFetchers).map((url, index) => {
          const { title, body } = AddressInfoFetcherPanel(
            customAddressInfoFetchers[url]
          );
          return (
            <Collapse.Panel header={title} key={"custom" + index}>
              {/* This technically is incorrect */}
              <Button onClick={() => removeCustomList(index)}>
                Remove this list
              </Button>
              {body}
            </Collapse.Panel>
          );
        })}
        {builtInInfoFetchers.map((fetcher, index) => {
          const { title, body } = AddressInfoFetcherPanel(fetcher);
          return (
            <Collapse.Panel header={title} key={index}>
              {body}
            </Collapse.Panel>
          );
        })}
      </Collapse>
      <h4>Add custom List</h4>
      <Form
        form={customListForm}
        layout="inline"
        onFinish={onFinishCustomListForm}
      >
        <Form.Item name="type" label="List type" rules={requiredRules}>
          <Select style={{ minWidth: "200px" }} onChange={onListTypeChange}>
            <Select.Option value="generic">Generic List</Select.Option>
            <Select.Option value="token">Token list</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="URL" name="url" rules={requiredRules}>
          <Input />
        </Form.Item>
        <Form.Item shouldUpdate>
          {() => (
            <Button
              type="primary"
              htmlType="submit"
              disabled={
                !customAddressForm.isFieldsTouched(true) ||
                !!customAddressForm
                  .getFieldsError()
                  .filter(({ errors }) => errors.length).length
              }
            >
              Add List
            </Button>
          )}
        </Form.Item>
      </Form>
    </div>
  );
}
