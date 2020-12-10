import React, { Component } from 'react';
import { Button, InputGroup, FormControl, Accordion, Card } from 'react-bootstrap';
class Home extends Component {
    constructor(props) {
      super(props);
      this.state = {
        logs: {},
        value: ''
      };
      let localKibanaLogs = localStorage.getItem('kibanaLogs')
      if (localKibanaLogs) {
        // localKibanaLogs = JSON.parse(localKibanaLogs)_
        this.state.value = localKibanaLogs;
      }
      this.handleChange = this.handleChange.bind(this);
      this.submit = this.submit.bind(this);
    }
    
    handleChange(event) {
        this.setState({value: event.target.value});
    }

    submit(event) {
        let jsonScript = JSON.parse(this.state.value)
        localStorage.setItem('kibanaLogs', this.state.value);
        let logsArray = jsonScript.responses[0].hits.hits
        this.setState({logs: logsArray})
        let logValue;
        logsArray.forEach((logsEntry) => {
            logValue = logsEntry._source.log;
            let myRegexp = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3,6})/;
            let match = myRegexp.exec(logValue);
            logsEntry.sortingKey = match[1]
        });
        logsArray.sort((a, b) => {
            if (a.sortingKey < b.sortingKey){
                return 1;
            }
            if (a.sortingKey > b.sortingKey) {
                return -1;
            }
            return 0;
        })
        console.log(jsonScript);
    }
    
    render() {  
        let button;
        if (Object.keys(this.state.logs).length) {
            button = this.state.logs.map((entry, index) =>
                <Accordion key={index}>
                <Card>
                  <Card.Header>
                    <Accordion.Toggle as={Button} variant="link" eventKey={''+ index}>
                      Click me!
                    </Accordion.Toggle>{entry._source.log}
                  </Card.Header>
                  <Accordion.Collapse eventKey={''+index}>
                    <Card.Body>{entry._source.log}</Card.Body>
                  </Accordion.Collapse>
                </Card>
              </Accordion>
            )
        } 
      return (
        <div className="width-80">
            <InputGroup className="mb-3">
                <InputGroup.Prepend>
                <InputGroup.Text>KIBANA Logs Object</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl as="textarea" aria-label="With textarea" value={this.state.value} onChange={this.handleChange}/>
            </InputGroup>
            <Button variant="primary" onClick={this.submit}>Submit</Button>
            {button} 
        </div>
      );
    }
  }
  export default Home;