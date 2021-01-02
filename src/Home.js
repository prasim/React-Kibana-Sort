import React, { Component } from 'react';
import moment from 'moment';
import { set, keys, get, del } from "idb-keyval";
import { Button, ButtonGroup, InputGroup, FormControl, Accordion, Card } from 'react-bootstrap';
class Home extends Component {
    constructor(props) {
      super(props);
      this.state = {
        logs: {},
        k8sValue: '',
        scfValue: '',
        localStorageKeyName: '',
        localStorageKeys: [],
        showSaveAs: false
      };
      let localk8sKibanaLogs = localStorage.getItem('k8sLogs')
      let localscfKibanaLogs = localStorage.getItem('scfLogs')
      if (localk8sKibanaLogs) {
        // localKibanaLogs = JSON.parse(localKibanaLogs)_
        this.state.k8sValue = localk8sKibanaLogs;
      }
      if (localscfKibanaLogs) {
        // localKibanaLogs = JSON.parse(localKibanaLogs)_
        this.state.scfValue = localscfKibanaLogs;
      }
      
      this.handlek8sChange = this.handlek8sChange.bind(this);
      this.handlescfChange = this.handlescfChange.bind(this);
      this.submit = this.submit.bind(this);
      this.saveLog = this.saveLog.bind(this);
      this.handleKeyNameChange = this.handleKeyNameChange.bind(this);
      this.showThisLog = this.showThisLog.bind(this);
    }
    
    componentDidMount() {
      keys().then(keys => {
        this.setState({localStorageKeys: keys})
      });
    }

    handlek8sChange(event) {
        this.setState({k8sValue: event.target.value});
    }

    handlescfChange(event) {
      this.setState({scfValue: event.target.value});
    }

    handleKeyNameChange(event) {
      this.setState({localStorageKeyName: event.target.value});
    }
    getRandomColor() {
      let color = "hsl(" + Math.random() * 360 + ", 100%, 75%)";
      return color;
    }
    showThisLog(event) {
      
      let getKey = event.target.value;
      get(getKey).then(val => {
        if (val) {
          this.setState({logs: val,
            k8sValue: '',
            showSaveAs: false,
            scfValue: ''
          });
        }
      });
    }
    saveLog() {
      set(this.state.localStorageKeyName, this.state.logs);
      keys().then(keyValue => {
        this.setState({localStorageKeys: keyValue,
          showSaveAs: false
        })
      });
    }

    submit(event) {
        localStorage.setItem('k8sLogs', this.state.k8sValue);
        let k8slogsArray = [];
        if (this.state.k8sValue) {
          let k8sJsonScript = JSON.parse(this.state.k8sValue)
          k8slogsArray = k8sJsonScript.responses[0].hits.hits
        }
        
        localStorage.setItem('scfLogs', this.state.scfValue);
        let scflogsArray = [];
        if(this.state.scfValue) {
          let scfJsonScript = JSON.parse(this.state.scfValue);
          scflogsArray = scfJsonScript.responses[0].hits.hits
        }
                
        scflogsArray.forEach((logsEntry, index) => {
          logsEntry._source.log = logsEntry._source.msg;
          let momentTime = moment.utc(logsEntry.sort[0], "x");
          logsEntry._source.timeExact = momentTime.local().format('YYYY-MM-DD HH:mm:ss.SSS')
          logsEntry.sort[1] = index;
        });
        k8slogsArray.forEach((logsEntry, index) => {
          let logValue = logsEntry._source.log;
          let myRegexp = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3,6})/;
          let match = myRegexp.exec(logValue);
          let myRegexp2 = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3,6})/;
          let match2 = myRegexp2.exec(logValue);
          if (match && match[1]) {
            let sortingKey = match[1];
            let momentValue = moment.utc(sortingKey, "YYYY-MM-DD[T]h:mm:ss.SSSSSS");
            let epoch = momentValue.valueOf();
            logsEntry._source.timeExact = momentValue.local().format('YYYY-MM-DD HH:mm:ss.SSS');
            logsEntry.sort[0] = epoch;
            logsEntry.sort[1] = sortingKey;
          } else if (match2 && match2[1]) {
            let sortingKey = match2[1];
            let momentValue = moment.utc(sortingKey, "YYYY-MM-DD h:mm:ss,SSS");
            let epoch = momentValue.valueOf();
            logsEntry._source.timeExact = momentValue.local().format('YYYY-MM-DD HH:mm:ss.SSS');
            logsEntry.sort[0] = epoch;
            logsEntry.sort[1] = index;
          } else {
            let momentTime = moment.utc(logsEntry.sort[0], "x");
            logsEntry.doubtFull="[Doubtfull]";
            logsEntry._source.timeExact = momentTime.local().format('YYYY-MM-DD HH:mm:ss.SSS')
            logsEntry.sort[1] = index;
          }
          logsEntry._source.component_name = logsEntry._source.kubernetes.container_name;
        });
        let logsArray = [...k8slogsArray, ...scflogsArray];
        logsArray.sort((a, b) => {
            if (a.sort[0] < b.sort[0]){
              return 1;
            }
            if (a.sort[0] > b.sort[0]) {
              return -1;
            }
            if (a.sort[1] < b.sort[1]){
              return 1;
            }
            if (a.sort[1] > b.sort[1]) {
              return -1;
            }
            return 0;
        })
        
        this.setState({logs: logsArray, showSaveAs: true})
        console.log(logsArray);
    }
    
    render() {  
        let button, keysListButtons;
        if (Object.keys(this.state.logs).length) {
            button = this.state.logs.map((entry, index) =>
                <Accordion key={index}>
                <Card>
                  <Card.Header>
                    {entry.doubtFull}
                    <span className="bubble red">{entry._source.component_name}</span>&nbsp;
                    <span className="bubble green">{entry._source.timeExact}</span>&nbsp;
                    <span className="bubble green">{entry.sort[0]}</span> &nbsp;
                    <span className="bubble blue">{entry._source.log}</span> &nbsp;
                  </Card.Header>
                  <Accordion.Collapse eventKey={''+index}>
                    <Card.Body>{entry._source.log}</Card.Body>
                  </Accordion.Collapse>
                </Card>
              </Accordion>
            )
        } 
        if (Object.keys(this.state.localStorageKeys).length) {
          keysListButtons = this.state.localStorageKeys.map((entry, index) => 
            <Button onClick={this.showThisLog} variant="link" size="sm" value={entry}>{entry}</Button>
          ) 
        }
      return (
        <div className="main-section">
          <div className="width-10 overflow">&nbsp;
            <ButtonGroup vertical>
              {keysListButtons}
            </ButtonGroup>
          </div>
          <div className="width-80">
              <InputGroup className="mb-3">
                  <InputGroup.Prepend>
                  <InputGroup.Text>KIBANA(K8S) Logs Object</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl as="textarea" aria-label="With textarea" value={this.state.k8sValue} onChange={this.handlek8sChange}/>
              </InputGroup>
              <InputGroup className="mb-3">
                  <InputGroup.Prepend>
                  <InputGroup.Text>KIBANA(SCF) Logs Object</InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl as="textarea" aria-label="With textarea" value={this.state.scfValue} onChange={this.handlescfChange}/>
              </InputGroup>
              <div className="button-section">
                <div className="action-button">
                  <Button variant="primary" onClick={this.submit}>Submit</Button>
                </div>
                <div className={this.state.showSaveAs ? 'action-button' : 'hidden'}>
                  <InputGroup className="mb-3">
                    <InputGroup.Prepend>
                      <Button variant="outline-secondary" onClick={this.saveLog}>Save As</Button>
                    </InputGroup.Prepend>
                    <FormControl aria-describedby="basic-addon1" value={this.state.localStorageKeyName} onChange={this.handleKeyNameChange}/>
                  </InputGroup>
                </div>
              </div>
              <div className="overflow">
              {button} 
              </div>
          </div>
          <div className="width-10">&nbsp;</div>
        </div>
      );
    }
  }
  export default Home;